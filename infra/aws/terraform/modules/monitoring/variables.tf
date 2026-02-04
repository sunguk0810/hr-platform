# Monitoring Module Variables

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix for CloudWatch metrics"
  type        = string
}

variable "rds_instance_id" {
  description = "RDS instance identifier"
  type        = string
}

variable "redis_cluster_id" {
  description = "ElastiCache Redis cluster ID"
  type        = string
}

variable "services" {
  description = "Service configurations"
  type = map(object({
    port          = number
    cpu           = number
    memory        = number
    desired_count = number
    path_patterns = list(string)
  }))
}

variable "target_group_arns" {
  description = "Map of service name to target group ARN"
  type        = map(string)
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for alarm notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
