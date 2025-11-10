#!/bin/bash

# Update Script for Peeak
# Pulls latest code and redeploys

set -e

echo "🔄 Updating Peeak application..."

# Navigate to app directory
cd "$(dirname "$0")/.."

# Backup current version
echo "📦 Creating backup..."
docker compose logs > "logs-backup-$(date +%Y%m%d-%H%M%S).log"

# Pull latest code
echo "⬇️  Pulling latest code from GitHub..."
git pull origin main

# Rebuild and restart
echo "🔨 Rebuilding application..."
docker compose down
docker compose up -d --build

# Wait for app to start
echo "⏳ Waiting for application to start..."
sleep 10

# Health check
echo "🔍 Running health check..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Update successful! Application is running."
else
    echo "❌ Update failed! Application is not responding."
    echo "📋 Check logs with: docker compose logs -f"
    exit 1
fi
