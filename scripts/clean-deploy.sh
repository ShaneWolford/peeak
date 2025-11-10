#!/bin/bash

echo "🧹 Starting clean deployment..."

# Stop PM2
echo "🛑 Stopping PM2..."
pm2 stop peeak-app 2>/dev/null || true
pm2 delete peeak-app 2>/dev/null || true

# Clean build artifacts
echo "🗑️  Cleaning build artifacts..."
rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache

# Pull latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Start PM2
echo "🚀 Starting PM2..."
pm2 start npm --name "peeak-app" -- start
pm2 save

# Show status
echo "✅ Deployment complete!"
pm2 list
pm2 logs peeak-app --lines 20
