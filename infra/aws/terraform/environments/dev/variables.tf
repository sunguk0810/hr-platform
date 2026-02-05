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

# VPC Configuration Options
variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (set to false to use VPC Endpoints instead for cost savings)"
  type        = bool
  default     = false
}

variable "enable_vpc_endpoints" {
  description = "Enable VPC Endpoints for private subnet access to AWS services"
  type        = bool
  default     = true
}

# Redis Configuration Options
variable "use_elasticache" {
  description = "Use ElastiCache instead of Redis Fargate (ElastiCache is more robust but more expensive)"
  type        = bool
  default     = false
}

# Kafka Configuration Options
variable "enable_kafka" {
  description = "Enable Kafka EC2 instance (KRaft mode)"
  type        = bool
  default     = true
}

variable "kafka_instance_type" {
  description = "EC2 instance type for Kafka"
  type        = string
  default     = "t3.small"
}

variable "kafka_data_volume_size" {
  description = "Kafka data EBS volume size in GB"
  type        = number
  default     = 50
}

# Keycloak Configuration Options
variable "enable_internal_keycloak" {
  description = "Enable internal Keycloak on Fargate (for VPC-only access)"
  type        = bool
  default     = false
}

# Keycloak Configuration
variable "keycloak_client_secret" {
  description = "Keycloak client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "keycloak_issuer_uri" {
  description = "Keycloak issuer URI (e.g., https://keycloak.example.com/realms/hr-saas)"
  type        = string
  default     = ""
}

variable "keycloak_hostname" {
  description = "Public hostname for Keycloak Admin Console (e.g., auth.port-sw.com)"
  type        = string
  default     = ""
}

variable "keycloak_client_id" {
  description = "Keycloak client ID"
  type        = string
  default     = "hr-saas-api"
}

# Kafka/MSK Configuration
variable "kafka_bootstrap_servers" {
  description = "Kafka/MSK bootstrap servers"
  type        = string
  default     = ""
}

# CORS Configuration
variable "cors_allowed_origins" {
  description = "CORS allowed origins (comma-separated)"
  type        = string
  default     = "https://app.example.com"
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
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/*", "/actuator/*"]
    }
    "auth-service" = {
      port          = 8081
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/v1/auth/*"]
    }
    "tenant-service" = {
      port          = 8082
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/v1/tenants/*"]
    }
    "organization-service" = {
      port          = 8083
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/v1/organizations/*", "/api/v1/departments/*"]
    }
    "employee-service" = {
      port          = 8084
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/v1/employees/*"]
    }
    "attendance-service" = {
      port          = 8085
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/v1/attendance/*", "/api/v1/leaves/*"]
    }
    "approval-service" = {
      port          = 8086
      cpu           = 512
      memory        = 1024
      desired_count = 1
      path_patterns = ["/api/v1/approvals/*"]
    }
    "mdm-service" = {
      port          = 8087
      cpu           = 512
      memory        = 1024
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

# Frontend Configuration
variable "frontend_domain" {
  description = "Frontend domain name (e.g., app.example.com)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID for DNS records"
  type        = string
}
