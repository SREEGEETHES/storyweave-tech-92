# ─────────────────────────────────────────────────────────────────────────────
# ElastiCache Redis — BullMQ job queue backend
# ─────────────────────────────────────────────────────────────────────────────

resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.project}-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${var.project}-redis-subnet-group" }
}

resource "aws_elasticache_parameter_group" "redis7" {
  name   = "${var.project}-redis7-params"
  family = "redis7"

  # Enable keyspace notifications for BullMQ delayed jobs
  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${var.project}-redis"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.redis7.name
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]

  # Automatic minor version upgrades during maintenance window
  auto_minor_version_upgrade = true
  maintenance_window         = "sun:05:00-sun:06:00"
  snapshot_retention_limit   = 1
  snapshot_window            = "04:00-05:00"

  tags = { Name = "${var.project}-redis" }
}
