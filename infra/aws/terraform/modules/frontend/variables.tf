# Frontend Module Variables

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "domain_names" {
  description = "List of domain names for CloudFront (e.g., ['app.example.com'])"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ARN of ACM certificate (must be in us-east-1 for CloudFront)"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route53 hosted zone ID (optional, for automatic DNS record creation)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
