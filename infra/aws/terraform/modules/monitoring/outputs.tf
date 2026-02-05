# Monitoring Module Outputs

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "dashboard_arn" {
  description = "CloudWatch dashboard ARN"
  value       = aws_cloudwatch_dashboard.main.dashboard_arn
}

output "cpu_alarm_arns" {
  description = "Map of service name to CPU alarm ARN"
  value       = { for k, v in aws_cloudwatch_metric_alarm.ecs_cpu_high : k => v.arn }
}

output "memory_alarm_arns" {
  description = "Map of service name to memory alarm ARN"
  value       = { for k, v in aws_cloudwatch_metric_alarm.ecs_memory_high : k => v.arn }
}

output "rds_cpu_alarm_arn" {
  description = "RDS CPU alarm ARN"
  value       = aws_cloudwatch_metric_alarm.rds_cpu_high.arn
}

output "rds_storage_alarm_arn" {
  description = "RDS storage alarm ARN"
  value       = aws_cloudwatch_metric_alarm.rds_storage_low.arn
}

output "redis_cpu_alarm_arn" {
  description = "Redis CPU alarm ARN (empty if not using ElastiCache)"
  value       = length(aws_cloudwatch_metric_alarm.redis_cpu_high) > 0 ? aws_cloudwatch_metric_alarm.redis_cpu_high[0].arn : ""
}

output "redis_memory_alarm_arn" {
  description = "Redis memory alarm ARN (empty if not using ElastiCache)"
  value       = length(aws_cloudwatch_metric_alarm.redis_memory_high) > 0 ? aws_cloudwatch_metric_alarm.redis_memory_high[0].arn : ""
}
