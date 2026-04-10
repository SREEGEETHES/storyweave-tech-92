# ─────────────────────────────────────────────────────────────────────────────
# ECR — one repository per service image
# ─────────────────────────────────────────────────────────────────────────────

locals {
  ecr_repos = ["frontend", "api", "orchestrator", "workers", "gpu-server"]
}

resource "aws_ecr_repository" "frontend" {
  name                 = "${var.project}/frontend"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "api" {
  name                 = "${var.project}/api"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "orchestrator" {
  name                 = "${var.project}/orchestrator"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "workers" {
  name                 = "${var.project}/workers"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "gpu_server" {
  name                 = "${var.project}/gpu-server"
  image_tag_mutability = var.ecr_image_tag_mutability

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Lifecycle policy — keep only the 10 most recent images to control storage cost
resource "aws_ecr_lifecycle_policy" "keep_last_10" {
  for_each = {
    frontend     = aws_ecr_repository.frontend.name
    api          = aws_ecr_repository.api.name
    orchestrator = aws_ecr_repository.orchestrator.name
    workers      = aws_ecr_repository.workers.name
    gpu_server   = aws_ecr_repository.gpu_server.name
  }

  repository = each.value

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
