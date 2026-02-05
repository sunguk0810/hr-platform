# Kafka EC2 Module Outputs

output "instance_id" {
  description = "Kafka EC2 instance ID"
  value       = aws_instance.kafka.id
}

output "private_ip" {
  description = "Kafka EC2 private IP address"
  value       = aws_instance.kafka.private_ip
}

output "bootstrap_servers" {
  description = "Kafka bootstrap servers string"
  value       = "${aws_instance.kafka.private_ip}:9092"
}

output "security_group_id" {
  description = "Kafka security group ID"
  value       = aws_security_group.kafka.id
}

output "iam_role_arn" {
  description = "Kafka IAM role ARN"
  value       = aws_iam_role.kafka.arn
}

output "data_volume_id" {
  description = "Kafka data EBS volume ID"
  value       = aws_ebs_volume.kafka_data.id
}
