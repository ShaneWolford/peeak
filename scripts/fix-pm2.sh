#!/bin/bash

set -e

echo "🔧 Fixing PM2 configuration..."

cd /root/app/peeak

# Stop all PM2 processes
echo "Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Make sure .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your environment variables"
    exit 1
fi

# Load environment variables
echo "Loading environment variables..."
set -a
source .env
set +a

# Verify build exists
if [ ! -d .next ]; then
    echo "📦 Building application..."
    npm run build
fi

# Create logs directory
mkdir -p ~/.pm2/logs

# Start with ecosystem config
echo "🚀 Starting app with PM2..."
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ PM2 fixed and started!"
echo ""
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs peeak-app"
echo ""

# Show current status
pm2 list
