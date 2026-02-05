# Keycloak Module Variables

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

variable "keycloak_security_group_id" {
  description = "Security group ID for Keycloak"
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

variable "db_host" {
  description = "Database host"
  type        = string
}

variable "db_port" {
  description = "Database port"
  type        = number
  default     = 5432
}

variable "db_secret_arn" {
  description = "ARN of database credentials secret"
  type        = string
}

variable "keycloak_admin_secret_arn" {
  description = "ARN of Keycloak admin password secret"
  type        = string
}

variable "secrets_access_policy_arn" {
  description = "ARN of IAM policy for secrets access"
  type        = string
}

variable "keycloak_hostname" {
  description = "Public hostname for Keycloak (e.g., auth.port-sw.com)"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of ALB target group for Keycloak (optional)"
  type        = string
  default     = ""
}

variable "keycloak_image" {
  description = "Keycloak Docker image (use ECR image in private subnets without NAT)"
  type        = string
  default     = "quay.io/keycloak/keycloak:23.0"
}

variable "cpu" {
  description = "CPU units for Keycloak task"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Memory for Keycloak task in MB"
  type        = number
  default     = 1024
}

variable "desired_count" {
  description = "Desired number of Keycloak tasks"
  type        = number
  default     = 1
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
