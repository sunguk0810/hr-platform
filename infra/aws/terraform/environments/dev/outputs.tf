# HR SaaS Platform - Dev Environment Outputs

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# ECR Outputs
output "ecr_repository_urls" {
  description = "ECR repository URLs"
  value       = module.ecr.repository_urls
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.db_endpoint
}

output "rds_host" {
  description = "RDS host"
  value       = module.rds.db_host
}

# Redis Outputs
output "redis_endpoint" {
  description = "Redis endpoint (ElastiCache or Fargate)"
  value       = var.use_elasticache ? module.elasticache[0].redis_endpoint : (length(module.redis_fargate) > 0 ? module.redis_fargate[0].redis_endpoint : "")
}

# Kafka Outputs
output "kafka_bootstrap_servers" {
  description = "Kafka bootstrap servers"
  value       = var.enable_kafka ? module.kafka[0].bootstrap_servers : var.kafka_bootstrap_servers
}

output "kafka_instance_id" {
  description = "Kafka EC2 instance ID"
  value       = var.enable_kafka ? module.kafka[0].instance_id : ""
}

# Keycloak Outputs
output "keycloak_internal_url" {
  description = "Internal Keycloak URL (via Service Discovery)"
  value       = var.enable_internal_keycloak && length(module.keycloak) > 0 ? module.keycloak[0].internal_url : var.keycloak_issuer_uri
}

# ALB Outputs
output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID"
  value       = module.alb.alb_zone_id
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_service_names" {
  description = "ECS service names"
  value       = module.ecs.service_names
}

# Secrets Outputs
output "db_credentials_secret_name" {
  description = "Database credentials secret name"
  value       = module.secrets.db_credentials_secret_name
}

output "redis_credentials_secret_name" {
  description = "Redis credentials secret name"
  value       = module.secrets.redis_credentials_secret_name
}

# Frontend Outputs
output "frontend_s3_bucket" {
  description = "Frontend S3 bucket name"
  value       = module.frontend.s3_bucket_name
}

output "frontend_cloudfront_id" {
  description = "Frontend CloudFront distribution ID"
  value       = module.frontend.cloudfront_distribution_id
}

output "frontend_url" {
  description = "Frontend website URL"
  value       = module.frontend.website_url
}

# API Gateway Outputs
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL (CORS enabled)"
  value       = module.api_gateway.api_endpoint
}
