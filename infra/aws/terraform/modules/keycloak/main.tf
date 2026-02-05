# Keycloak Fargate Module for HR SaaS Platform
# Runs Keycloak on ECS Fargate with ARM64 (Graviton)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# CloudWatch Log Group for Keycloak
resource "aws_cloudwatch_log_group" "keycloak" {
  name              = "/ecs/${var.project}-${var.environment}/keycloak"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-keycloak-logs"
    Service = "keycloak"
  })
}

# IAM Role for Keycloak Task Execution
resource "aws_iam_role" "keycloak_execution" {
  name = "${var.project}-${var.environment}-keycloak-execution-role"

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

resource "aws_iam_role_policy_attachment" "keycloak_execution" {
  role       = aws_iam_role.keycloak_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy_attachment" "keycloak_secrets" {
  role       = aws_iam_role.keycloak_execution.name
  policy_arn = var.secrets_access_policy_arn
}

# IAM Role for Keycloak Task
resource "aws_iam_role" "keycloak_task" {
  name = "${var.project}-${var.environment}-keycloak-task-role"

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

# Service Discovery for Keycloak
resource "aws_service_discovery_service" "keycloak" {
  name = "keycloak"

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
    Name = "${var.project}-${var.environment}-keycloak-discovery"
  })
}

# Keycloak Task Definition
resource "aws_ecs_task_definition" "keycloak" {
  family                   = "${var.project}-${var.environment}-keycloak"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.keycloak_execution.arn
  task_role_arn            = aws_iam_role.keycloak_task.arn

  # Graviton ARM64 for cost savings
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = "keycloak"
      image     = var.keycloak_image
      essential = true

      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "KC_DB", value = "postgres" },
        { name = "KC_DB_URL", value = "jdbc:postgresql://${var.db_host}:${var.db_port}/keycloak?sslmode=require" },
        { name = "KC_DB_SCHEMA", value = "public" },
        { name = "KC_HOSTNAME", value = var.keycloak_hostname },
        { name = "KC_HOSTNAME_STRICT", value = "false" },
        { name = "KC_HOSTNAME_STRICT_HTTPS", value = "false" },
        { name = "KC_HTTP_ENABLED", value = "true" },
        { name = "KC_PROXY", value = "edge" },
        { name = "KC_HEALTH_ENABLED", value = "true" },
        { name = "KC_METRICS_ENABLED", value = "true" },
        { name = "KEYCLOAK_ADMIN", value = "admin" }
      ]

      secrets = [
        { name = "KC_DB_USERNAME", valueFrom = "${var.db_secret_arn}:username::" },
        { name = "KC_DB_PASSWORD", valueFrom = "${var.db_secret_arn}:password::" },
        { name = "KEYCLOAK_ADMIN_PASSWORD", valueFrom = "${var.keycloak_admin_secret_arn}:keycloak_admin_password::" }
      ]

      command = ["start-dev", "--db=postgres", "--import-realm"]

      healthCheck = {
        command     = ["CMD-SHELL", "exec 3<>/dev/tcp/127.0.0.1/8080;echo -e 'GET /health/ready HTTP/1.1\\r\\nhost: localhost\\r\\nConnection: close\\r\\n\\r\\n' >&3;grep -q '200 OK' <&3"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 120
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.keycloak.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "keycloak"
        }
      }
    }
  ])

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-keycloak"
    Service = "keycloak"
  })
}

# Keycloak ECS Service
resource "aws_ecs_service" "keycloak" {
  name            = "${var.project}-${var.environment}-keycloak"
  cluster         = var.ecs_cluster_id
  task_definition = aws_ecs_task_definition.keycloak.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.keycloak_security_group_id]
    assign_public_ip = false
  }

  # ALB Target Group for external access
  dynamic "load_balancer" {
    for_each = var.target_group_arn != "" ? [1] : []
    content {
      target_group_arn = var.target_group_arn
      container_name   = "keycloak"
      container_port   = 8080
    }
  }

  service_registries {
    registry_arn = aws_service_discovery_service.keycloak.arn
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_maximum_percent         = 200
  deployment_minimum_healthy_percent = 100
  health_check_grace_period_seconds  = 180

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-keycloak-service"
    Service = "keycloak"
  })

  lifecycle {
    ignore_changes = [desired_count]
  }
}
