#!/bin/bash

# Emergency fix for all common issues

echo "🚨 Emergency Fix Script"
echo "======================"

# Stop everything
echo "1️⃣ Stopping all processes..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Check for nested directory
if [ -d "/root/app/peeak/peeak" ]; then
    echo "2️⃣ Fixing nested directory structure..."
    cd /root/app
    mv peeak peeak-broken
    mv peeak-broken/peeak peeak
    rm -rf peeak-broken
fi

# Go to correct directory
cd /root/app/peeak

# Pull latest code
echo "3️⃣ Pulling latest code..."
git fetch origin
git reset --hard origin/main
git clean -fd

# Remove all caches
echo "4️⃣ Clearing all caches..."
rm -rf node_modules
rm -rf .next
rm -rf .turbo
rm -rf .npm
rm -rf ~/.npm
rm -rf /tmp/*

# Fresh install
echo "5️⃣ Installing dependencies..."
npm cache clean --force
npm install

# Build
echo "6️⃣ Building application..."
NODE_ENV=production npm run build

# Check if build succeeded
if [ ! -d ".next" ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

# Start with ecosystem config
echo "7️⃣ Starting with PM2..."
pm2 start ecosystem.config.json
pm2 save

echo ""
echo "✅ Emergency fix complete!"
echo ""
pm2 status
echo ""
echo "View logs: pm2 logs peeak"
