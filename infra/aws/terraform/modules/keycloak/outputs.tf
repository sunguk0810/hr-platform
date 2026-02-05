# Keycloak Module Outputs

output "service_name" {
  description = "Keycloak ECS service name"
  value       = aws_ecs_service.keycloak.name
}

output "service_arn" {
  description = "Keycloak ECS service ARN"
  value       = aws_ecs_service.keycloak.id
}

output "task_definition_arn" {
  description = "Keycloak task definition ARN"
  value       = aws_ecs_task_definition.keycloak.arn
}

output "service_discovery_arn" {
  description = "Service Discovery ARN for Keycloak"
  value       = aws_service_discovery_service.keycloak.arn
}

output "internal_url" {
  description = "Internal URL for Keycloak (via Service Discovery)"
  value       = "http://keycloak.${var.service_discovery_namespace}:8080"
}

output "log_group_name" {
  description = "CloudWatch Log Group name"
  value       = aws_cloudwatch_log_group.keycloak.name
}
