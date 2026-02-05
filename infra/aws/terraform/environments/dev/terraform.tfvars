# HR SaaS Platform - Dev Environment Values
# Updated: 2026-02-05

project     = "hr-platform"
environment = "dev"
aws_region  = "ap-northeast-2"

# VPC Configuration
vpc_cidr           = "10.0.0.0/16"
availability_zones = ["ap-northeast-2a", "ap-northeast-2c"]

# Database Configuration
db_username          = "hr_saas_admin"
db_name              = "hr_saas"
db_instance_class    = "db.t3.micro"
db_allocated_storage = 20

# ElastiCache Configuration
redis_node_type = "cache.t3.micro"

# ==========================================
# Cost Optimization Options (Dev Environment)
# ==========================================

# VPC Configuration
# NAT Gateway costs ~$45/month, VPC Endpoints cost ~$14/month
enable_nat_gateway   = false
enable_vpc_endpoints = true

# Redis Configuration
# ElastiCache (cache.t3.micro) costs ~$13/month
# Redis Fargate (256 CPU, 512MB) costs ~$8/month
use_elasticache = true

# Kafka Configuration
# Kafka EC2 (t3.small) costs ~$15/month
enable_kafka           = true
kafka_instance_type    = "t3.small"
kafka_data_volume_size = 50

# Keycloak Configuration
# Set to true to run Keycloak internally on Fargate (within VPC)
# Set to false to use external Keycloak (e.g., managed service or existing deployment)
enable_internal_keycloak = true

# SSL Certificate
certificate_arn = "arn:aws:acm:ap-northeast-2:564630939575:certificate/c67459ab-025f-44bc-a6f5-aacf98723667"

# Keycloak Configuration
keycloak_issuer_uri    = "https://auth.port-sw.com/realms/hr-saas"
keycloak_client_id     = "hr-saas-api"
keycloak_client_secret = ""
keycloak_hostname      = "auth.port-sw.com"

# Kafka Configuration (MSK 구축 전까지 빈 값)
kafka_bootstrap_servers = ""

# CORS Configuration
cors_allowed_origins = "https://app.port-sw.com,https://admin.port-sw.com"

# SNS Topic for Alerts (Optional)
sns_topic_arn = ""

# Container Image Tag
image_tag = "latest"

# Frontend Configuration
frontend_domain = "app.port-sw.com"
hosted_zone_id  = "Z02224541G8ZQ9L0U4QSI"

# Additional Tags
tags = {
  CostCenter = "engineering"
  Team       = "platform"
  Owner      = "backend-api"
}
