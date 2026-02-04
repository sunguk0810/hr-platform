# ECS Module Variables

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

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "ecs_security_group_id" {
  description = "ECS tasks security group ID"
  type        = string
}

variable "ecr_repository_urls" {
  description = "Map of service name to ECR repository URL"
  type        = map(string)
}

variable "target_group_arns" {
  description = "Map of service name to target group ARN"
  type        = map(string)
}

variable "db_secret_arn" {
  description = "ARN of database credentials secret"
  type        = string
}

variable "redis_secret_arn" {
  description = "ARN of Redis credentials secret"
  type        = string
}

variable "app_secret_arn" {
  description = "ARN of application secrets"
  type        = string
}

variable "secrets_access_policy_arn" {
  description = "ARN of secrets access IAM policy"
  type        = string
}

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "redis_host" {
  description = "Redis host"
  type        = string
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
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

variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
