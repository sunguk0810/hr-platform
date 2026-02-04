# HR SaaS Platform - Dev Environment Values
# Copy this file to terraform.tfvars.local and fill in the values

project     = "hr-platform"
environment = "dev"
aws_region  = "ap-northeast-2"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-northeast-2a"]  # Single AZ for MVP cost savings

# Database Configuration
db_username          = "hr_saas_admin"
db_name              = "hr_saas"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# ElastiCache Configuration
redis_node_type = "cache.t3.micro"

# SSL Certificate (Replace with your ACM certificate ARN)
# certificate_arn = "arn:aws:acm:ap-northeast-2:ACCOUNT_ID:certificate/CERTIFICATE_ID"

# SNS Topic for Alerts (Optional - Create SNS topic first)
# sns_topic_arn = "arn:aws:sns:ap-northeast-2:ACCOUNT_ID:hr-platform-alerts"

# Container Image Tag
image_tag = "latest"

# Additional Tags
tags = {
  CostCenter = "engineering"
  Team       = "platform"
}
