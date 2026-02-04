# ECR Module Variables

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}

variable "enable_cross_account_access" {
  description = "Enable cross-account ECR access"
  type        = bool
  default     = false
}

variable "cross_account_arns" {
  description = "List of ARNs for cross-account access"
  type        = list(string)
  default     = []
}
