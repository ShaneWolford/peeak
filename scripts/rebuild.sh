#!/bin/bash

# Rebuild and restart the application with new environment variables
# This is needed when NEXT_PUBLIC_ variables change

echo "🔄 Rebuilding Peeak with new environment variables..."

cd "$(dirname "$0")/.."

# Stop existing containers
echo "🛑 Stopping containers..."
docker compose down

# Rebuild with no cache to ensure env vars are fresh
echo "🏗️  Building with new environment variables..."
docker compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker compose up -d

# Wait for healthcheck
echo "⏳ Waiting for application to be healthy..."
sleep 10

# Check status
docker compose ps

echo "✅ Rebuild complete!"
echo "🌐 Check your app at: ${NEXT_PUBLIC_SITE_URL:-http://localhost:3000}"
