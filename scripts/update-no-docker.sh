#!/bin/bash

set -e

echo "📥 Updating Peeak..."

cd /root/app/peeak

# Pull latest changes
echo "Pulling latest code..."
git pull origin main

# Load environment variables
set -a
source .env
set +a

# Install dependencies
echo "Installing dependencies..."
pnpm install

# Build application
echo "Building application..."
pnpm run build

# Restart PM2 process
echo "Restarting application..."
pm2 restart peeak

echo "✅ Update complete!"
