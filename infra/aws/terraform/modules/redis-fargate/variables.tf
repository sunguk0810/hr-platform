# Redis Fargate Module Variables

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "ecs_cluster_id" {
  description = "ECS Cluster ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "redis_security_group_id" {
  description = "Security group ID for Redis"
  type        = string
}

variable "service_discovery_namespace_id" {
  description = "Service Discovery namespace ID"
  type        = string
}

variable "service_discovery_namespace" {
  description = "Service Discovery namespace name (e.g., hr-platform.dev.local)"
  type        = string
}

variable "redis_password" {
  description = "Redis authentication password"
  type        = string
  sensitive   = true
}

variable "redis_image" {
  description = "Redis Docker image (use ECR image in private subnets without NAT)"
  type        = string
  default     = "arm64v8/redis:7-alpine"
}

variable "secrets_access_policy_arn" {
  description = "ARN of IAM policy for secrets access"
  type        = string
}

variable "cpu" {
  description = "CPU units for Redis task"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory for Redis task in MB"
  type        = number
  default     = 512
}

variable "desired_count" {
  description = "Desired number of Redis tasks"
  type        = number
  default     = 1
}

variable "enable_persistence" {
  description = "Enable EFS persistence for Redis data"
  type        = bool
  default     = false
}

variable "efs_file_system_id" {
  description = "EFS file system ID for persistence (required if enable_persistence is true)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
