# ALB Module Outputs

output "alb_id" {
  description = "ALB ID"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "ALB ARN"
  value       = aws_lb.main.arn
}

output "alb_arn_suffix" {
  description = "ALB ARN suffix (for CloudWatch)"
  value       = aws_lb.main.arn_suffix
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = aws_lb.main.zone_id
}

output "target_group_arns" {
  description = "Map of service name to target group ARN"
  value       = { for k, v in aws_lb_target_group.services : k => v.arn }
}

output "target_group_arn_suffixes" {
  description = "Map of service name to target group ARN suffix"
  value       = { for k, v in aws_lb_target_group.services : k => v.arn_suffix }
}

output "https_listener_arn" {
  description = "HTTPS listener ARN"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}

output "http_listener_arn" {
  description = "HTTP listener ARN"
  value       = aws_lb_listener.http.arn
}

output "keycloak_target_group_arn" {
  description = "Keycloak target group ARN"
  value       = length(aws_lb_target_group.keycloak) > 0 ? aws_lb_target_group.keycloak[0].arn : ""
}
