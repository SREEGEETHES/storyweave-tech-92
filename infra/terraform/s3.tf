# ─────────────────────────────────────────────────────────────────────────────
# S3 — renders bucket (final MP4s) and assets bucket (intermediate AI assets)
# ─────────────────────────────────────────────────────────────────────────────

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# ── Renders bucket ────────────────────────────────────────────────────────────
resource "aws_s3_bucket" "renders" {
  bucket        = "${var.s3_renders_bucket}-${random_id.bucket_suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "renders" {
  bucket = aws_s3_bucket.renders.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "renders" {
  bucket = aws_s3_bucket.renders.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "renders" {
  bucket = aws_s3_bucket.renders.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]  # Tighten to your domain in production
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Lifecycle: move renders to Glacier after 90 days, expire after 1 year
resource "aws_s3_bucket_lifecycle_configuration" "renders" {
  bucket = aws_s3_bucket.renders.id

  rule {
    id     = "archive-old-renders"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    expiration {
      days = 365
    }
  }
}

resource "aws_s3_bucket_public_access_block" "renders" {
  bucket                  = aws_s3_bucket.renders.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ── Assets bucket (intermediate generated images/audio) ──────────────────────
resource "aws_s3_bucket" "assets" {
  bucket        = "${var.s3_assets_bucket}-${random_id.bucket_suffix.hex}"
  force_destroy = false
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

# Assets are ephemeral — expire intermediate files after 30 days
resource "aws_s3_bucket_lifecycle_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    id     = "expire-temp-assets"
    status = "Enabled"

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket                  = aws_s3_bucket.assets.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
