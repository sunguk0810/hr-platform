# HR SaaS Platform - Dev Environment Variables

variable "project" {
  description = "Project name"
  type        = string
  default     = "hr-platform"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-2"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["ap-northeast-2a"]  # Single AZ for MVP
}

# Database Configuration
variable "db_username" {
  description = "Database username"
  type        = string
  default     = "hr_saas_admin"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "hr_saas"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

# ElastiCache Configuration
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t3.micro"
}

# Keycloak Configuration
variable "keycloak_client_secret" {
  description = "Keycloak client secret"
  type        = string
  default     = ""
  sensitive   = true
}

# SSL Certificate
variable "certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
  default     = ""
}

# SNS Topic for Alerts
variable "sns_topic_arn" {
  description = "ARN of SNS topic for CloudWatch alarms"
  type        = string
  default     = ""
}

# Container Image Tag
variable "image_tag" {
  description = "Docker image tag to deploy"
  type        = string
  default     = "latest"
}

# Services Configuration
variable "services" {
  description = "Service configurations"
  type = map(object({
    port          = number
    cpu           = number
    memory        = number
    desired_count = number
    path_patterns = list(string)
  }))
  default = {
    "gateway-service" = {
      port          = 8080
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/*", "/actuator/*"]
    }
    "auth-service" = {
      port          = 8081
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/auth/*"]
    }
    "tenant-service" = {
      port          = 8082
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/tenants/*"]
    }
    "organization-service" = {
      port          = 8083
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/organizations/*", "/api/v1/departments/*"]
    }
    "employee-service" = {
      port          = 8084
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/employees/*"]
    }
    "attendance-service" = {
      port          = 8085
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/attendance/*", "/api/v1/leaves/*"]
    }
    "approval-service" = {
      port          = 8086
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/approvals/*"]
    }
    "mdm-service" = {
      port          = 8087
      cpu           = 256
      memory        = 512
      desired_count = 1
      path_patterns = ["/api/v1/codes/*", "/api/v1/menus/*"]
    }
  }
}

# Additional Tags
variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default = {
    CostCenter = "engineering"
    Team       = "platform"
  }
}
