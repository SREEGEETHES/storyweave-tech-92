# ─────────────────────────────────────────────────────────────────────────────
# ECS Fargate — cluster + service definitions for API, Orchestrator, Workers
# GPU server is deployed to Kubernetes (GPU nodes) — see infra/k8s/
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_ecs_cluster" "main" {
  name = "${var.project}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name       = aws_ecs_cluster.main.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ── CloudWatch Log Groups ─────────────────────────────────────────────────────
resource "aws_cloudwatch_log_group" "api" {
  name              = "/storyweave/api"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "orchestrator" {
  name              = "/storyweave/orchestrator"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "workers" {
  name              = "/storyweave/workers"
  retention_in_days = 14
}

# ── API Task Definition ───────────────────────────────────────────────────────
resource "aws_ecs_task_definition" "api" {
  family                   = "${var.project}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.api_cpu
  memory                   = var.api_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "api"
    image     = "${aws_ecr_repository.api.repository_url}:latest"
    essential = true
    portMappings = [{
      containerPort = 3001
      protocol      = "tcp"
    }]
    environment = [
      { name = "NODE_ENV",    value = "production" },
      { name = "PORT",        value = "3001" },
      { name = "AWS_REGION",  value = var.aws_region },
      { name = "S3_BUCKET_NAME", value = aws_s3_bucket.renders.bucket }
    ]
    secrets = [
      { name = "JWT_SECRET",               valueFrom = "/${var.project}/api/jwt_secret" },
      { name = "NEON_DATABASE_URL",        valueFrom = "/${var.project}/api/neon_database_url" },
      { name = "AWS_ACCESS_KEY_ID",        valueFrom = "/${var.project}/api/aws_access_key_id" },
      { name = "AWS_SECRET_ACCESS_KEY",    valueFrom = "/${var.project}/api/aws_secret_access_key" },
      { name = "REDIS_URL",                valueFrom = "/${var.project}/shared/redis_url" },
      { name = "REMOTION_LAMBDA_FUNCTION_NAME", valueFrom = "/${var.project}/api/remotion_function_name" },
      { name = "REMOTION_SERVE_URL",       valueFrom = "/${var.project}/api/remotion_serve_url" },
      { name = "RENDER_WEBHOOK_SECRET",    valueFrom = "/${var.project}/api/webhook_secret" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.api.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "api"
      }
    }
    healthCheck = {
      command     = ["CMD-SHELL", "wget -qO- http://localhost:3001/health || exit 1"]
      interval    = 30
      timeout     = 5
      retries     = 3
      startPeriod = 15
    }
  }])
}

# ── Orchestrator Task Definition ──────────────────────────────────────────────
resource "aws_ecs_task_definition" "orchestrator" {
  family                   = "${var.project}-orchestrator"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "orchestrator"
    image     = "${aws_ecr_repository.orchestrator.repository_url}:latest"
    essential = true
    environment = [
      { name = "NODE_ENV",    value = "production" },
      { name = "AWS_REGION",  value = var.aws_region },
      { name = "S3_BUCKET_NAME", value = aws_s3_bucket.assets.bucket }
    ]
    secrets = [
      { name = "REDIS_URL",             valueFrom = "/${var.project}/shared/redis_url" },
      { name = "ANTHROPIC_API_KEY",     valueFrom = "/${var.project}/orchestrator/anthropic_api_key" },
      { name = "NEON_DATABASE_URL",     valueFrom = "/${var.project}/api/neon_database_url" },
      { name = "AWS_ACCESS_KEY_ID",     valueFrom = "/${var.project}/api/aws_access_key_id" },
      { name = "AWS_SECRET_ACCESS_KEY", valueFrom = "/${var.project}/api/aws_secret_access_key" },
      { name = "GPU_SERVER_URL",        valueFrom = "/${var.project}/shared/gpu_server_url" },
      { name = "GPU_SERVER_API_KEY",    valueFrom = "/${var.project}/shared/gpu_server_api_key" },
      { name = "REMOTION_LAMBDA_FUNCTION_NAME", valueFrom = "/${var.project}/api/remotion_function_name" },
      { name = "REMOTION_SERVE_URL",    valueFrom = "/${var.project}/api/remotion_serve_url" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.orchestrator.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "orchestrator"
      }
    }
  }])
}

# ── Workers Task Definition ───────────────────────────────────────────────────
resource "aws_ecs_task_definition" "workers" {
  family                   = "${var.project}-workers"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.worker_cpu
  memory                   = var.worker_memory
  execution_role_arn       = aws_iam_role.ecs_execution_role.arn
  task_role_arn            = aws_iam_role.ecs_task_role.arn

  container_definitions = jsonencode([{
    name      = "workers"
    image     = "${aws_ecr_repository.workers.repository_url}:latest"
    essential = true
    environment = [
      { name = "NODE_ENV",    value = "production" },
      { name = "AWS_REGION",  value = var.aws_region },
      { name = "S3_BUCKET_NAME", value = aws_s3_bucket.assets.bucket }
    ]
    secrets = [
      { name = "REDIS_URL",             valueFrom = "/${var.project}/shared/redis_url" },
      { name = "AWS_ACCESS_KEY_ID",     valueFrom = "/${var.project}/api/aws_access_key_id" },
      { name = "AWS_SECRET_ACCESS_KEY", valueFrom = "/${var.project}/api/aws_secret_access_key" },
      { name = "GPU_SERVER_URL",        valueFrom = "/${var.project}/shared/gpu_server_url" },
      { name = "GPU_SERVER_API_KEY",    valueFrom = "/${var.project}/shared/gpu_server_api_key" }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.workers.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "workers"
      }
    }
  }])
}

# ── ECS Services ──────────────────────────────────────────────────────────────
resource "aws_ecs_service" "api" {
  name            = "${var.project}-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition] # Managed by CI/CD
  }
}

resource "aws_ecs_service" "orchestrator" {
  name            = "${var.project}-orchestrator"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.orchestrator.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition]
  }
}

resource "aws_ecs_service" "workers" {
  name            = "${var.project}-workers"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.workers.arn
  desired_count   = var.worker_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count] # desired_count managed by App Auto Scaling
  }
}

# ── App Auto Scaling for Workers ──────────────────────────────────────────────
resource "aws_appautoscaling_target" "workers" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.workers.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "workers_cpu" {
  name               = "${var.project}-workers-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.workers.resource_id
  scalable_dimension = aws_appautoscaling_target.workers.scalable_dimension
  service_namespace  = aws_appautoscaling_target.workers.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
