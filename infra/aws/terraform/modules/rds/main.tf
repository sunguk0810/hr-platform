# RDS PostgreSQL Module for HR SaaS Platform

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.project}-${var.environment}-db-subnet"
  subnet_ids = var.private_subnet_ids

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-db-subnet"
  })
}

# DB Parameter Group
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${var.project}-${var.environment}-pg15-params"

  # Enable SSL
  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  # Logging configuration
  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries > 1 second
  }

  # Connection settings
  parameter {
    name  = "max_connections"
    value = "100"
  }

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-pg15-params"
  })
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "${var.project}-${var.environment}-postgres"

  # Engine Configuration
  engine               = "postgres"
  engine_version       = "15.4"
  instance_class       = var.instance_class

  # Storage Configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  # Database Configuration
  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  # Network Configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_security_group_id]
  publicly_accessible    = false

  # Availability
  multi_az = var.environment == "prod"

  # Backup Configuration
  backup_retention_period = var.environment == "prod" ? 7 : 1
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  # Performance Insights (free tier for t3.micro)
  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  # Parameter Group
  parameter_group_name = aws_db_parameter_group.main.name

  # Deletion Protection
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project}-${var.environment}-final-snapshot" : null
  deletion_protection       = var.environment == "prod"

  # Enable automated minor version upgrades
  auto_minor_version_upgrade = true

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-postgres"
  })
}
