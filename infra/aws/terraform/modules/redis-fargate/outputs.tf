# Redis Fargate Module Outputs

output "service_name" {
  description = "Redis ECS service name"
  value       = aws_ecs_service.redis.name
}

output "service_arn" {
  description = "Redis ECS service ARN"
  value       = aws_ecs_service.redis.id
}

output "task_definition_arn" {
  description = "Redis task definition ARN"
  value       = aws_ecs_task_definition.redis.arn
}

output "service_discovery_arn" {
  description = "Service Discovery ARN for Redis"
  value       = aws_service_discovery_service.redis.arn
}

output "redis_host" {
  description = "Redis host (via Service Discovery)"
  value       = "redis.${var.service_discovery_namespace}"
}

output "redis_port" {
  description = "Redis port"
  value       = 6379
}

output "redis_endpoint" {
  description = "Redis endpoint (host:port)"
  value       = "redis.${var.service_discovery_namespace}:6379"
}

output "log_group_name" {
  description = "CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.redis.name
}
