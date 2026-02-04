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

  # Uncomment to use S3 backend for state management
  # backend "s3" {
  #   bucket         = "hr-platform-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "ap-northeast-2"
  #   encrypt        = true
  #   dynamodb_table = "hr-platform-terraform-locks"
  # }
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

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  project            = var.project
  environment        = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = var.tags
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

# ElastiCache Module (Phase 3)
module "elasticache" {
  source = "../../modules/elasticache"

  project               = var.project
  environment           = var.environment
  private_subnet_ids    = module.vpc.private_subnet_ids
  redis_security_group_id = module.vpc.redis_security_group_id
  node_type             = var.redis_node_type
  redis_password        = module.secrets.redis_password
  tags                  = var.tags
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
  tags                  = var.tags
}

# ECS Module (Phase 4)
module "ecs" {
  source = "../../modules/ecs"

  project                  = var.project
  environment              = var.environment
  aws_region               = var.aws_region
  vpc_id                   = module.vpc.vpc_id
  private_subnet_ids       = module.vpc.private_subnet_ids
  ecs_security_group_id    = module.vpc.ecs_tasks_security_group_id
  ecr_repository_urls      = module.ecr.repository_urls
  target_group_arns        = module.alb.target_group_arns
  db_secret_arn            = module.secrets.db_credentials_secret_arn
  redis_secret_arn         = module.secrets.redis_credentials_secret_arn
  app_secret_arn           = module.secrets.app_secrets_arn
  secrets_access_policy_arn = module.secrets.secrets_access_policy_arn
  db_host                  = module.rds.db_host
  db_port                  = module.rds.db_port
  redis_host               = module.elasticache.redis_host
  redis_port               = module.elasticache.redis_port
  services                 = var.services
  image_tag                = var.image_tag
  tags                     = var.tags
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
  redis_cluster_id  = module.elasticache.redis_cluster_id
  services          = var.services
  target_group_arns = module.alb.target_group_arns
  sns_topic_arn     = var.sns_topic_arn
  tags              = var.tags
}
