# VPC Module Variables

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region for VPC Endpoints"
  type        = string
  default     = "ap-northeast-2"
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway (set to false to use VPC Endpoints instead)"
  type        = bool
  default     = false
}

variable "enable_vpc_endpoints" {
  description = "Enable VPC Endpoints for private subnet access to AWS services"
  type        = bool
  default     = true
}
