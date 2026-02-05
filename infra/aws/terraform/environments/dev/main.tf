# HR SaaS Platform - Dev Environment
# Main Terraform configuration

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # S3 backend for state management
  # NOTE: Before enabling, create S3 bucket and DynamoDB table:
  #   aws s3api create-bucket --bucket hr-platform-terraform-state --region ap-northeast-2 --create-bucket-configuration LocationConstraint=ap-northeast-2
  #   aws s3api put-bucket-versioning --bucket hr-platform-terraform-state --versioning-configuration Status=Enabled
  #   aws dynamodb create-table --table-name hr-platform-terraform-locks --attribute-definitions AttributeName=LockID,AttributeType=S --key-schema AttributeName=LockID,KeyType=HASH --billing-mode PAY_PER_REQUEST
  backend "s3" {
    bucket         = "hr-platform-tf-state-564630939575"
    key            = "dev/terraform.tfstate"
    region         = "ap-northeast-2"
    encrypt        = true
    dynamodb_table = "hr-platform-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# US East 1 provider for CloudFront ACM certificate
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  project              = var.project
  environment          = var.environment
  aws_region           = var.aws_region
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  enable_nat_gateway   = var.enable_nat_gateway
  enable_vpc_endpoints = var.enable_vpc_endpoints
  tags                 = var.tags
}

# ECR Module
module "ecr" {
  source = "../../modules/ecr"

  project     = var.project
  environment = var.environment
  tags        = var.tags
}

# Secrets Module
module "secrets" {
  source = "../../modules/secrets"

  project                = var.project
  environment            = var.environment
  db_username            = var.db_username
  db_name                = var.db_name
  keycloak_client_secret = var.keycloak_client_secret
  tags                   = var.tags
}

# RDS Module (Phase 3)
module "rds" {
  source = "../../modules/rds"

  project              = var.project
  environment          = var.environment
  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  rds_security_group_id = module.vpc.rds_security_group_id
  db_username          = var.db_username
  db_name              = var.db_name
  db_password          = module.secrets.db_password
  instance_class       = var.db_instance_class
  allocated_storage    = var.db_allocated_storage
  tags                 = var.tags
}

# ElastiCache Module (Phase 3) - Optional, can be replaced by Redis Fargate
module "elasticache" {
  count  = var.use_elasticache ? 1 : 0
  source = "../../modules/elasticache"

  project               = var.project
  environment           = var.environment
  private_subnet_ids    = module.vpc.private_subnet_ids
  redis_security_group_id = module.vpc.redis_security_group_id
  node_type             = var.redis_node_type
  redis_password        = module.secrets.redis_password
  tags                  = var.tags
}

# Kafka EC2 Module (KRaft mode - no ZooKeeper)
module "kafka" {
  count  = var.enable_kafka ? 1 : 0
  source = "../../modules/kafka-ec2"

  project                     = var.project
  environment                 = var.environment
  vpc_id                      = module.vpc.vpc_id
  private_subnet_id           = module.vpc.private_subnet_ids[0]
  availability_zone           = var.availability_zones[0]
  ecs_tasks_security_group_id = module.vpc.ecs_tasks_security_group_id
  instance_type               = var.kafka_instance_type
  data_volume_size            = var.kafka_data_volume_size
  tags                        = var.tags
}

# ALB Module (Phase 4)
module "alb" {
  source = "../../modules/alb"

  project               = var.project
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.vpc.alb_security_group_id
  certificate_arn       = var.certificate_arn
  services              = var.services
  # Keycloak routing
  enable_keycloak       = var.enable_internal_keycloak
  keycloak_hostname     = var.keycloak_hostname
  tags                  = var.tags
}

# ECS Module (Phase 4)
module "ecs" {
  source = "../../modules/ecs"

  project                   = var.project
  environment               = var.environment
  aws_region                = var.aws_region
  vpc_id                    = module.vpc.vpc_id
  private_subnet_ids        = module.vpc.private_subnet_ids
  ecs_security_group_id     = module.vpc.ecs_tasks_security_group_id
  ecr_repository_urls       = module.ecr.repository_urls
  target_group_arns         = module.alb.target_group_arns
  db_secret_arn             = module.secrets.db_credentials_secret_arn
  redis_secret_arn          = module.secrets.redis_credentials_secret_arn
  app_secret_arn            = module.secrets.app_secrets_arn
  secrets_access_policy_arn = module.secrets.secrets_access_policy_arn
  db_host                   = module.rds.db_host
  db_port                   = module.rds.db_port
  # Use ElastiCache if enabled, otherwise use Redis Fargate via Service Discovery
  redis_host                = var.use_elasticache ? module.elasticache[0].redis_host : "redis.${var.project}.${var.environment}.local"
  redis_port                = var.use_elasticache ? module.elasticache[0].redis_port : 6379
  redis_ssl_enabled         = var.use_elasticache  # ElastiCache requires TLS
  services                  = var.services
  image_tag                 = var.image_tag
  # Use Kafka EC2 if enabled, otherwise use configured bootstrap servers
  kafka_bootstrap_servers   = var.enable_kafka ? module.kafka[0].bootstrap_servers : var.kafka_bootstrap_servers
  # Use internal Keycloak if enabled, otherwise use external
  keycloak_issuer_uri       = var.enable_internal_keycloak ? "http://keycloak.${var.project}.${var.environment}.local:8080/realms/hr-saas" : var.keycloak_issuer_uri
  keycloak_client_id        = var.keycloak_client_id
  keycloak_secret_arn       = module.secrets.app_secrets_arn
  cors_allowed_origins      = var.cors_allowed_origins
  tags                      = var.tags
}

# Redis Fargate Module (cost-effective alternative to ElastiCache)
module "redis_fargate" {
  count  = var.use_elasticache ? 0 : 1
  source = "../../modules/redis-fargate"

  project                        = var.project
  environment                    = var.environment
  aws_region                     = var.aws_region
  ecs_cluster_id                 = module.ecs.cluster_id
  private_subnet_ids             = module.vpc.private_subnet_ids
  redis_security_group_id        = module.vpc.redis_security_group_id
  service_discovery_namespace_id = module.ecs.service_discovery_namespace_id
  service_discovery_namespace    = module.ecs.service_discovery_namespace_name
  redis_password                 = module.secrets.redis_password
  secrets_access_policy_arn      = module.secrets.secrets_access_policy_arn
  redis_image                    = "564630939575.dkr.ecr.ap-northeast-2.amazonaws.com/hr-platform/redis:7-alpine"
  cpu                            = 256
  memory                         = 512
  tags                           = var.tags
}

# Keycloak Fargate Module (internal Keycloak for VPC)
module "keycloak" {
  count  = var.enable_internal_keycloak ? 1 : 0
  source = "../../modules/keycloak"

  project                        = var.project
  environment                    = var.environment
  aws_region                     = var.aws_region
  ecs_cluster_id                 = module.ecs.cluster_id
  private_subnet_ids             = module.vpc.private_subnet_ids
  keycloak_security_group_id     = module.vpc.ecs_tasks_security_group_id
  service_discovery_namespace_id = module.ecs.service_discovery_namespace_id
  service_discovery_namespace    = module.ecs.service_discovery_namespace_name
  db_host                        = module.rds.db_host
  db_port                        = module.rds.db_port
  db_secret_arn                  = module.secrets.db_credentials_secret_arn
  keycloak_admin_secret_arn      = module.secrets.app_secrets_arn
  secrets_access_policy_arn      = module.secrets.secrets_access_policy_arn
  keycloak_hostname              = var.keycloak_hostname
  target_group_arn               = module.alb.keycloak_target_group_arn
  keycloak_image                 = "564630939575.dkr.ecr.ap-northeast-2.amazonaws.com/hr-platform/keycloak:23.0"
  cpu                            = 512
  memory                         = 1024
  tags                           = var.tags
}

# Monitoring Module (Phase 6)
module "monitoring" {
  source = "../../modules/monitoring"

  project           = var.project
  environment       = var.environment
  aws_region        = var.aws_region
  ecs_cluster_name  = module.ecs.cluster_name
  alb_arn_suffix    = module.alb.alb_arn_suffix
  rds_instance_id   = module.rds.db_instance_id
  redis_cluster_id    = var.use_elasticache ? module.elasticache[0].redis_cluster_id : ""
  enable_redis_alarms = var.use_elasticache
  services            = var.services
  target_group_arns   = module.alb.target_group_arns
  sns_topic_arn       = var.sns_topic_arn
  tags                = var.tags
}

# ACM Certificate for CloudFront (must be in us-east-1)
resource "aws_acm_certificate" "frontend" {
  provider          = aws.us_east_1
  domain_name       = var.frontend_domain
  validation_method = "DNS"

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-frontend-cert"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# DNS validation for CloudFront certificate
resource "aws_route53_record" "frontend_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.frontend.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.hosted_zone_id
}

resource "aws_acm_certificate_validation" "frontend" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.frontend.arn
  validation_record_fqdns = [for record in aws_route53_record.frontend_cert_validation : record.fqdn]
}

# Frontend Module (S3 + CloudFront)
module "frontend" {
  source = "../../modules/frontend"

  project         = var.project
  environment     = var.environment
  domain_names    = [var.frontend_domain]
  certificate_arn = aws_acm_certificate_validation.frontend.certificate_arn
  hosted_zone_id  = var.hosted_zone_id
  tags            = var.tags
}

# API Gateway Module (CORS enabled)
module "api_gateway" {
  source = "../../modules/api-gateway"

  project      = var.project
  environment  = var.environment
  alb_dns_name = module.alb.alb_dns_name
  tags         = var.tags
}
