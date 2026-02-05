# ECS Task Definitions for HR SaaS Services

# CloudWatch Log Groups per service
resource "aws_cloudwatch_log_group" "services" {
  for_each = var.services

  name              = "/ecs/${var.project}-${var.environment}/${each.key}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}-logs"
    Service = each.key
  })
}

# Task Definitions
resource "aws_ecs_task_definition" "services" {
  for_each = var.services

  family                   = "${var.project}-${var.environment}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = each.value.cpu
  memory                   = each.value.memory
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  # Graviton ARM64 for cost savings (~20% cheaper than x86)
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = "${var.ecr_repository_urls[each.key]}:${var.image_tag}"
      essential = true

      portMappings = [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          protocol      = "tcp"
        }
      ]

      environment = [
        { name = "JAVA_TOOL_OPTIONS", value = "-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+UseStringDeduplication -Djava.security.egd=file:/dev/./urandom" },
        { name = "SPRING_PROFILES_ACTIVE", value = "aws" },
        { name = "SERVER_PORT", value = tostring(each.value.port) },
        { name = "DB_HOST", value = var.db_host },
        { name = "DB_PORT", value = tostring(var.db_port) },
        { name = "REDIS_HOST", value = var.redis_host },
        { name = "REDIS_PORT", value = tostring(var.redis_port) },
        { name = "REDIS_SSL_ENABLED", value = tostring(var.redis_ssl_enabled) },
        { name = "SERVICE_DISCOVERY_NAMESPACE", value = "${var.project}.${var.environment}.local" },
        { name = "KAFKA_BOOTSTRAP_SERVERS", value = var.kafka_bootstrap_servers },
        { name = "KEYCLOAK_ISSUER_URI", value = var.keycloak_issuer_uri },
        { name = "KEYCLOAK_CLIENT_ID", value = var.keycloak_client_id },
        { name = "CORS_ALLOWED_ORIGINS", value = var.cors_allowed_origins }
      ]

      secrets = [
        { name = "DB_USERNAME", valueFrom = "${var.db_secret_arn}:username::" },
        { name = "DB_PASSWORD", valueFrom = "${var.db_secret_arn}:password::" },
        { name = "REDIS_PASSWORD", valueFrom = "${var.redis_secret_arn}:password::" },
        { name = "JWT_SECRET", valueFrom = "${var.app_secret_arn}:jwt_secret::" },
        { name = "KEYCLOAK_CLIENT_SECRET", valueFrom = "${var.keycloak_secret_arn}:keycloak_client_secret::" }
      ]

      healthCheck = {
        command     = ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:${each.value.port}/actuator/health || exit 1"]
        interval    = 30
        timeout     = 10
        retries     = 3
        startPeriod = 60
      }

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}"
    Service = each.key
  })
}
