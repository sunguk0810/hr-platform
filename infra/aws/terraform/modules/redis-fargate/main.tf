# Redis Fargate Module for HR SaaS Platform
# Runs Redis on ECS Fargate with ARM64 (Graviton)
# Cost-effective alternative to ElastiCache for dev environments

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudWatch Log Group for Redis
resource "aws_cloudwatch_log_group" "redis" {
  name              = "/ecs/${var.project}-${var.environment}/redis"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-redis-logs"
    Service = "redis"
  })
}

# IAM Role for Redis Task Execution
resource "aws_iam_role" "redis_execution" {
  name = "${var.project}-${var.environment}-redis-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "redis_execution" {
  role       = aws_iam_role.redis_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "redis_secrets" {
  role       = aws_iam_role.redis_execution.name
  policy_arn = var.secrets_access_policy_arn
}

# Service Discovery for Redis
resource "aws_service_discovery_service" "redis" {
  name = "redis"

  dns_config {
    namespace_id = var.service_discovery_namespace_id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-redis-discovery"
  })
}

# Redis Task Definition
resource "aws_ecs_task_definition" "redis" {
  family                   = "${var.project}-${var.environment}-redis"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.redis_execution.arn

  # Graviton ARM64 for cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "redis"
      image     = var.redis_image
      essential = true

      portMappings = [
        {
          containerPort = 6379
          hostPort      = 6379
          protocol      = "tcp"
        }
      ]

      # Redis configuration for password authentication
      command = [
        "redis-server",
        "--requirepass", var.redis_password,
        "--maxmemory", "${floor(var.memory * 0.75)}mb",
        "--maxmemory-policy", "volatile-lru",
        "--appendonly", "yes",
        "--appendfsync", "everysec"
      ]

      healthCheck = {
        command     = ["CMD", "redis-cli", "-a", var.redis_password, "ping"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 10
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.redis.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "redis"
        }
      }

      # Mount EFS for data persistence (optional)
      mountPoints = var.enable_persistence ? [
        {
          sourceVolume  = "redis-data"
          containerPath = "/data"
          readOnly      = false
        }
      ] : []
    }
  ])

  # EFS Volume for persistence (optional)
  dynamic "volume" {
    for_each = var.enable_persistence ? [1] : []
    content {
      name = "redis-data"

      efs_volume_configuration {
        file_system_id     = var.efs_file_system_id
        root_directory     = "/redis"
        transit_encryption = "ENABLED"
      }
    }
  }

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-redis"
    Service = "redis"
  })
}

# Redis ECS Service
resource "aws_ecs_service" "redis" {
  name            = "${var.project}-${var.environment}-redis"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.redis.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.redis_security_group_id]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.redis.arn
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_maximum_percent         = 100  # Only 1 instance at a time for data safety
  deployment_minimum_healthy_percent = 0

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-redis-service"
    Service = "redis"
  })

  lifecycle {
    ignore_changes = [desired_count]
  }
}
