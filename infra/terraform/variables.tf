variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (staging | production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be 'staging' or 'production'."
  }
}

variable "project" {
  description = "Project name prefix for all resource names"
  type        = string
  default     = "storyweave"
}

# ── Networking ─────────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to spread subnets across"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

# ── ECS ────────────────────────────────────────────────────────────────────────
variable "api_cpu" {
  description = "Fargate vCPU units for the API task (1024 = 1 vCPU)"
  type        = number
  default     = 512
}

variable "api_memory" {
  description = "Fargate memory (MB) for the API task"
  type        = number
  default     = 1024
}

variable "worker_cpu" {
  description = "Fargate vCPU units for asset-worker tasks"
  type        = number
  default     = 1024
}

variable "worker_memory" {
  description = "Fargate memory (MB) for asset-worker tasks"
  type        = number
  default     = 2048
}

variable "worker_desired_count" {
  description = "Desired number of worker task replicas"
  type        = number
  default     = 2
}

# ── Redis ──────────────────────────────────────────────────────────────────────
variable "redis_node_type" {
  description = "ElastiCache node type"
  type        = string
  default     = "cache.t4g.small"
}

variable "redis_num_cache_nodes" {
  description = "Number of ElastiCache nodes"
  type        = number
  default     = 1
}

# ── S3 ─────────────────────────────────────────────────────────────────────────
variable "s3_renders_bucket" {
  description = "S3 bucket for final MP4 renders"
  type        = string
  default     = "storyweave-renders"
}

variable "s3_assets_bucket" {
  description = "S3 bucket for intermediate AI-generated assets"
  type        = string
  default     = "storyweave-assets"
}

# ── ECR ─────────────────────────────────────────────────────────────────────────
variable "ecr_image_tag_mutability" {
  description = "Image tag mutability for ECR repos"
  type        = string
  default     = "IMMUTABLE"
}
