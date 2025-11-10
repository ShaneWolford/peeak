#!/bin/bash

echo "🧹 Cleaning VPS deployment..."

# Stop PM2
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# Remove any stray middleware.ts file
if [ -f "middleware.ts" ]; then
  echo "🗑️  Removing old middleware.ts file..."
  rm middleware.ts
fi

# Clean all caches
echo "🧹 Removing all build caches..."
rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf .swc

# Get latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build
echo "🔨 Building application..."
npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  
  # Start PM2
  echo "🚀 Starting PM2..."
  pm2 start npm --name "peeak-app" -- start
  pm2 save
  
  echo "✅ Deployment complete!"
  echo ""
  echo "Check status: pm2 status"
  echo "View logs: pm2 logs peeak-app"
else
  echo "❌ Build failed! Check the errors above."
  exit 1
fi
