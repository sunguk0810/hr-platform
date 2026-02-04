# ElastiCache Module Outputs

output "redis_cluster_id" {
  description = "Redis cluster ID"
  value       = aws_elasticache_cluster.main.cluster_id
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_host" {
  description = "Redis host"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_cluster.main.port
}

output "redis_arn" {
  description = "Redis cluster ARN"
  value       = aws_elasticache_cluster.main.arn
}
