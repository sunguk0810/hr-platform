# Application Load Balancer Module for HR SaaS Platform

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.project}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod"

  tags = merge(var.tags, {
    Name = "${var.project}-${var.environment}-alb"
  })
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  count = var.certificate_arn != "" ? 1 : 0

  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services["gateway-service"].arn
  }
}

# HTTP Listener (redirect to HTTPS or forward if no certificate)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = var.certificate_arn != "" ? "redirect" : "forward"

    dynamic "redirect" {
      for_each = var.certificate_arn != "" ? [1] : []
      content {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }

    target_group_arn = var.certificate_arn == "" ? aws_lb_target_group.services["gateway-service"].arn : null
  }
}

# Target Groups for each service
resource "aws_lb_target_group" "services" {
  for_each = var.services

  name        = "${var.project}-${var.environment}-${substr(replace(each.key, "-service", ""), 0, 15)}"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/actuator/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 10
    unhealthy_threshold = 3
  }

  # Enable stickiness for stateful services
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = false
  }

  tags = merge(var.tags, {
    Name    = "${var.project}-${var.environment}-${each.key}-tg"
    Service = each.key
  })
}

# Listener Rules for routing to backend services (HTTPS)
resource "aws_lb_listener_rule" "services_https" {
  for_each = var.certificate_arn != "" ? { for k, v in var.services : k => v if k != "gateway-service" } : {}

  listener_arn = aws_lb_listener.https[0].arn
  priority     = index(keys(var.services), each.key) + 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }
}

# Listener Rules for routing to backend services (HTTP - when no certificate)
resource "aws_lb_listener_rule" "services_http" {
  for_each = var.certificate_arn == "" ? { for k, v in var.services : k => v if k != "gateway-service" } : {}

  listener_arn = aws_lb_listener.http.arn
  priority     = index(keys(var.services), each.key) + 1

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_patterns
    }
  }
}
