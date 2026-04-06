#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# Deployment script — runs ON the droplet via GitHub Actions
# Dockerized deployment: pull code → build images → restart
# ──────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/safipoints"
REPO_URL="$1"

cd "$APP_DIR"

# Pull latest code
if [ -d .git ]; then
  git fetch origin main
  git reset --hard origin/main
else
  git clone "$REPO_URL" .
fi

# Build and restart containers (production only — no override file)
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d

# Clean up dangling images
docker image prune -f

echo "✅ Docker deployment complete!"
