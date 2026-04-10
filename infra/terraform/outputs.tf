output "vpc_id" {
  description = "ID of the StoryWeave VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets (ALB, NAT)"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets (ECS tasks)"
  value       = aws_subnet.private[*].id
}

output "ecs_cluster_arn" {
  description = "ARN of the ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "redis_endpoint" {
  description = "ElastiCache Redis primary endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
  sensitive   = true
}

output "renders_bucket_name" {
  description = "Name of the S3 renders bucket"
  value       = aws_s3_bucket.renders.bucket
}

output "assets_bucket_name" {
  description = "Name of the S3 assets bucket"
  value       = aws_s3_bucket.assets.bucket
}

output "ecr_frontend_url" {
  description = "ECR repository URL for the frontend image"
  value       = aws_ecr_repository.frontend.repository_url
}

output "ecr_api_url" {
  description = "ECR repository URL for the API image"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_orchestrator_url" {
  description = "ECR repository URL for the orchestrator image"
  value       = aws_ecr_repository.orchestrator.repository_url
}

output "ecr_workers_url" {
  description = "ECR repository URL for the workers image"
  value       = aws_ecr_repository.workers.repository_url
}

output "ecr_gpu_server_url" {
  description = "ECR repository URL for the GPU server image"
  value       = aws_ecr_repository.gpu_server.repository_url
}

output "ecs_task_role_arn" {
  description = "ARN of the IAM role assumed by ECS tasks"
  value       = aws_iam_role.ecs_task_role.arn
}
