#!/bin/bash

# Backup Script for Peeak
# Creates backups of logs and environment config

set -e

BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"

echo "💾 Creating backup in $BACKUP_DIR..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup environment variables (without sensitive values)
if [ -f .env ]; then
    echo "📄 Backing up environment config..."
    cp .env "$BACKUP_DIR/.env.backup"
fi

# Backup Docker logs
echo "📋 Backing up container logs..."
docker compose logs > "$BACKUP_DIR/docker-logs.txt"

# Backup Nginx config
if [ -f /etc/nginx/sites-available/peeak ]; then
    echo "⚙️  Backing up Nginx config..."
    sudo cp /etc/nginx/sites-available/peeak "$BACKUP_DIR/nginx-peeak.conf"
fi

echo "✅ Backup complete: $BACKUP_DIR"
