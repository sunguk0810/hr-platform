# Kafka EC2 Module Variables

variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_id" {
  description = "Private subnet ID for Kafka instance"
  type        = string
}

variable "availability_zone" {
  description = "Availability zone for Kafka instance and EBS volume"
  type        = string
}

variable "ecs_tasks_security_group_id" {
  description = "Security group ID for ECS tasks (to allow Kafka access)"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for Kafka"
  type        = string
  default     = "t3.small"
}

variable "data_volume_size" {
  description = "Size of EBS data volume in GB"
  type        = number
  default     = 50
}

variable "key_pair_name" {
  description = "EC2 key pair name for SSH access (optional)"
  type        = string
  default     = ""
}

variable "enable_ssh" {
  description = "Enable SSH access to Kafka instance"
  type        = bool
  default     = false
}

variable "ssh_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
