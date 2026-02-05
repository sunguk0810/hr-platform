# Kafka EC2 Module for HR SaaS Platform
# Runs Apache Kafka in KRaft mode (no ZooKeeper) on EC2
# Cost-effective solution for dev/staging environments

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-kernel-6.1-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for Kafka
resource "aws_security_group" "kafka" {
  name        = "${var.project}-${var.environment}-kafka-sg"
  description = "Security group for Kafka EC2 instance"
  vpc_id      = var.vpc_id

  # Kafka broker port from ECS tasks
  ingress {
    from_port       = 9092
    to_port         = 9092
    protocol        = "tcp"
    security_groups = [var.ecs_tasks_security_group_id]
    description     = "Kafka broker from ECS tasks"
  }

  # Kafka controller port (internal)
  ingress {
    from_port   = 9093
    to_port     = 9093
    protocol    = "tcp"
    self        = true
    description = "Kafka controller (internal)"
  }

  # SSH access (optional, for debugging)
  dynamic "ingress" {
    for_each = var.enable_ssh ? [1] : []
    content {
      from_port   = 22
      to_port     = 22
      protocol    = "tcp"
      cidr_blocks = var.ssh_cidr_blocks
      description = "SSH access"
    }
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-kafka-sg"
  })
}

# IAM Role for Kafka EC2
resource "aws_iam_role" "kafka" {
  name = "${var.project}-${var.environment}-kafka-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

# SSM access for EC2 Instance Connect
resource "aws_iam_role_policy_attachment" "kafka_ssm" {
  role       = aws_iam_role.kafka.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# CloudWatch agent policy
resource "aws_iam_role_policy_attachment" "kafka_cloudwatch" {
  role       = aws_iam_role.kafka.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "kafka" {
  name = "${var.project}-${var.environment}-kafka-profile"
  role = aws_iam_role.kafka.name
}

# EBS Volume for Kafka data
resource "aws_ebs_volume" "kafka_data" {
  availability_zone = var.availability_zone
  size              = var.data_volume_size
  type              = "gp3"
  iops              = 3000
  throughput        = 125
  encrypted         = true

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-kafka-data"
  })
}

# Kafka EC2 Instance
resource "aws_instance" "kafka" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.instance_type
  subnet_id              = var.private_subnet_id
  vpc_security_group_ids = [aws_security_group.kafka.id]
  iam_instance_profile   = aws_iam_instance_profile.kafka.name
  key_name               = var.key_pair_name

  root_block_device {
    volume_size           = 30
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e

    # Install Java 17
    dnf install -y java-17-amazon-corretto-headless wget

    # Create kafka user
    useradd -r -s /sbin/nologin kafka

    # Download and install Kafka
    KAFKA_VERSION="3.6.1"
    SCALA_VERSION="2.13"
    cd /opt
    wget -q "https://downloads.apache.org/kafka/$KAFKA_VERSION/kafka_$SCALA_VERSION-$KAFKA_VERSION.tgz"
    tar -xzf "kafka_$SCALA_VERSION-$KAFKA_VERSION.tgz"
    ln -s "kafka_$SCALA_VERSION-$KAFKA_VERSION" kafka
    chown -R kafka:kafka /opt/kafka*

    # Wait for EBS volume to attach
    while [ ! -e /dev/nvme1n1 ] && [ ! -e /dev/xvdf ]; do
      sleep 5
    done

    # Format and mount data volume
    DEVICE=$(ls /dev/nvme1n1 /dev/xvdf 2>/dev/null | head -1)
    if ! blkid $DEVICE; then
      mkfs.xfs $DEVICE
    fi
    mkdir -p /data/kafka
    mount $DEVICE /data/kafka
    echo "$DEVICE /data/kafka xfs defaults,nofail 0 2" >> /etc/fstab
    chown -R kafka:kafka /data/kafka

    # Get instance metadata
    TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
    PRIVATE_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)

    # Generate cluster ID for KRaft
    CLUSTER_ID=$(/opt/kafka/bin/kafka-storage.sh random-uuid)

    # Configure KRaft mode
    cat > /opt/kafka/config/kraft/server.properties << 'CONFIG'
    # KRaft mode configuration
    process.roles=broker,controller
    node.id=1
    controller.quorum.voters=1@localhost:9093

    # Listeners
    listeners=PLAINTEXT://:9092,CONTROLLER://:9093
    inter.broker.listener.name=PLAINTEXT
    controller.listener.names=CONTROLLER
    advertised.listeners=PLAINTEXT://$${PRIVATE_IP}:9092

    # Log directories
    log.dirs=/data/kafka/logs

    # Replication settings
    num.partitions=3
    default.replication.factor=1
    min.insync.replicas=1
    offsets.topic.replication.factor=1
    transaction.state.log.replication.factor=1
    transaction.state.log.min.isr=1

    # Log retention
    log.retention.hours=168
    log.segment.bytes=1073741824
    log.retention.check.interval.ms=300000

    # Performance tuning
    num.network.threads=3
    num.io.threads=8
    socket.send.buffer.bytes=102400
    socket.receive.buffer.bytes=102400
    socket.request.max.bytes=104857600
    CONFIG

    # Replace private IP in config
    sed -i "s/\$${PRIVATE_IP}/$PRIVATE_IP/g" /opt/kafka/config/kraft/server.properties

    # Format storage
    /opt/kafka/bin/kafka-storage.sh format -t $CLUSTER_ID -c /opt/kafka/config/kraft/server.properties

    # Create systemd service
    cat > /etc/systemd/system/kafka.service << 'SERVICE'
    [Unit]
    Description=Apache Kafka Server (KRaft mode)
    Documentation=http://kafka.apache.org/documentation.html
    Requires=network.target
    After=network.target

    [Service]
    Type=simple
    User=kafka
    Group=kafka
    Environment=JAVA_HOME=/usr/lib/jvm/java-17-amazon-corretto
    Environment=KAFKA_HEAP_OPTS=-Xmx1G -Xms1G
    ExecStart=/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties
    ExecStop=/opt/kafka/bin/kafka-server-stop.sh
    Restart=on-failure
    RestartSec=10
    LimitNOFILE=65536

    [Install]
    WantedBy=multi-user.target
    SERVICE

    # Fix permissions and start service
    chown -R kafka:kafka /data/kafka
    systemctl daemon-reload
    systemctl enable kafka
    systemctl start kafka

    # Create default topics
    sleep 30
    /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic hr-saas.employee.created --partitions 3 --replication-factor 1 --if-not-exists
    /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic hr-saas.approval.completed --partitions 3 --replication-factor 1 --if-not-exists
    /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic hr-saas.notification.send --partitions 3 --replication-factor 1 --if-not-exists
    EOF
  )

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-kafka"
  })

  lifecycle {
    ignore_changes = [ami, user_data]
  }
}

# Attach EBS volume to instance
resource "aws_volume_attachment" "kafka_data" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.kafka_data.id
  instance_id = aws_instance.kafka.id
}

# CloudWatch alarms for Kafka
resource "aws_cloudwatch_metric_alarm" "kafka_cpu" {
  alarm_name          = "${var.project}-${var.environment}-kafka-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Kafka EC2 CPU utilization is high"

  dimensions = {
    InstanceId = aws_instance.kafka.id
  }

  tags = var.tags
}
