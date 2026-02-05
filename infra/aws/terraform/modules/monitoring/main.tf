# CloudWatch Monitoring Module for HR SaaS Platform

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ============================================
# CloudWatch Alarms
# ============================================

# ECS Service CPU High Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = var.services

  alarm_name          = "${var.project}-${var.environment}-${each.key}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization is too high for ${each.key}"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.key
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []
  ok_actions    = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}-cpu-alarm"
    Service = each.key
  })
}

# ECS Service Memory High Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  for_each = var.services

  alarm_name          = "${var.project}-${var.environment}-${each.key}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Memory utilization is too high for ${each.key}"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = each.key
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}-memory-alarm"
    Service = each.key
  })
}

# ALB Unhealthy Hosts Alarm
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  for_each = var.target_group_arns

  alarm_name          = "${var.project}-${var.environment}-${each.key}-unhealthy"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Unhealthy hosts detected for ${each.key}"

  dimensions = {
    TargetGroup  = regex("targetgroup/[^/]+/[^/]+", each.value)
    LoadBalancer = var.alb_arn_suffix
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}-unhealthy-alarm"
    Service = each.key
  })
}

# RDS CPU High Alarm
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  alarm_name          = "${var.project}-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "RDS CPU utilization is too high"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-rds-cpu-alarm"
  })
}

# RDS Free Storage Low Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  alarm_name          = "${var.project}-${var.environment}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 5368709120  # 5 GB in bytes
  alarm_description   = "RDS free storage is low (< 5GB)"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-rds-storage-alarm"
  })
}

# RDS Database Connections High Alarm
resource "aws_cloudwatch_metric_alarm" "rds_connections_high" {
  alarm_name          = "${var.project}-${var.environment}-rds-connections-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseConnections"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80  # Adjust based on instance type
  alarm_description   = "RDS database connections are high"

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-rds-connections-alarm"
  })
}

# ElastiCache CPU High Alarm (only when using ElastiCache)
resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  count = var.enable_redis_alarms ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ElastiCache Redis CPU utilization is too high"

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-redis-cpu-alarm"
  })
}

# ElastiCache Memory High Alarm (only when using ElastiCache)
resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  count = var.enable_redis_alarms ? 1 : 0

  alarm_name          = "${var.project}-${var.environment}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "ElastiCache Redis memory usage is too high"

  dimensions = {
    CacheClusterId = var.redis_cluster_id
  }

  alarm_actions = var.sns_topic_arn != "" ? [var.sns_topic_arn] : []

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-redis-memory-alarm"
  })
}

# ============================================
# CloudWatch Dashboard
# ============================================

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project}-${var.environment}"

  dashboard_body = jsonencode({
    widgets = concat(
      # ECS CPU Utilization
      [
        {
          type   = "metric"
          x      = 0
          y      = 0
          width  = 12
          height = 6
          properties = {
            title   = "ECS Service CPU Utilization"
            region  = var.aws_region
            metrics = [for service in keys(var.services) : [
              "AWS/ECS", "CPUUtilization",
              "ClusterName", var.ecs_cluster_name,
              "ServiceName", service
            ]]
            period = 300
            stat   = "Average"
            view   = "timeSeries"
          }
        }
      ],
      # ECS Memory Utilization
      [
        {
          type   = "metric"
          x      = 12
          y      = 0
          width  = 12
          height = 6
          properties = {
            title   = "ECS Service Memory Utilization"
            region  = var.aws_region
            metrics = [for service in keys(var.services) : [
              "AWS/ECS", "MemoryUtilization",
              "ClusterName", var.ecs_cluster_name,
              "ServiceName", service
            ]]
            period = 300
            stat   = "Average"
            view   = "timeSeries"
          }
        }
      ],
      # ALB Request Count
      [
        {
          type   = "metric"
          x      = 0
          y      = 6
          width  = 12
          height = 6
          properties = {
            title  = "ALB Request Count"
            region = var.aws_region
            metrics = [
              ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix]
            ]
            period = 60
            stat   = "Sum"
            view   = "timeSeries"
          }
        }
      ],
      # ALB Response Time
      [
        {
          type   = "metric"
          x      = 12
          y      = 6
          width  = 12
          height = 6
          properties = {
            title  = "ALB Target Response Time"
            region = var.aws_region
            metrics = [
              ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", var.alb_arn_suffix]
            ]
            period = 60
            stat   = "Average"
            view   = "timeSeries"
          }
        }
      ],
      # RDS Metrics
      [
        {
          type   = "metric"
          x      = 0
          y      = 12
          width  = 12
          height = 6
          properties = {
            title  = "RDS CPU & Connections"
            region = var.aws_region
            metrics = [
              ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", var.rds_instance_id],
              ["AWS/RDS", "DatabaseConnections", "DBInstanceIdentifier", var.rds_instance_id]
            ]
            period = 300
            view   = "timeSeries"
          }
        }
      ],
      # ElastiCache Metrics (only if using ElastiCache)
      var.redis_cluster_id != "" ? [
        {
          type   = "metric"
          x      = 12
          y      = 12
          width  = 12
          height = 6
          properties = {
            title  = "ElastiCache CPU & Memory"
            region = var.aws_region
            metrics = [
              ["AWS/ElastiCache", "CPUUtilization", "CacheClusterId", var.redis_cluster_id],
              ["AWS/ElastiCache", "DatabaseMemoryUsagePercentage", "CacheClusterId", var.redis_cluster_id]
            ]
            period = 300
            view   = "timeSeries"
          }
        }
      ] : [],
      # ALB HTTP Error Codes
      [
        {
          type   = "metric"
          x      = 0
          y      = 18
          width  = 12
          height = 6
          properties = {
            title  = "ALB HTTP 4xx/5xx Errors"
            region = var.aws_region
            metrics = [
              ["AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", var.alb_arn_suffix],
              ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", var.alb_arn_suffix]
            ]
            period = 60
            stat   = "Sum"
            view   = "timeSeries"
          }
        }
      ],
      # RDS Storage
      [
        {
          type   = "metric"
          x      = 12
          y      = 18
          width  = 12
          height = 6
          properties = {
            title  = "RDS Free Storage Space"
            region = var.aws_region
            metrics = [
              ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", var.rds_instance_id]
            ]
            period = 300
            stat   = "Average"
            view   = "timeSeries"
          }
        }
      ]
    )
  })
}
