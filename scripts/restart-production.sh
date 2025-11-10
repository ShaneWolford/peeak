#!/bin/bash

set -e

echo "🔄 Restarting Peeak production..."

cd /root/app/peeak

# Stop containers
docker compose -f docker-compose.prod.yml down

# Pull latest code
git pull origin main

# Rebuild and start
docker compose -f docker-compose.prod.yml up -d --build

echo "✅ Peeak restarted successfully"
echo "🌐 Visit: https://app.peeak.org"

# Show logs
docker compose -f docker-compose.prod.yml logs -f --tail=50
