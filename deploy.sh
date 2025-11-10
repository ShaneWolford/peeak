#!/bin/bash

set -e

echo "🚀 Peeak VPS Deployment"
echo "======================="

cd /root/app/peeak

# Stop PM2
echo "1️⃣ Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Kill port 3000
echo "2️⃣ Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clean everything
echo "3️⃣ Cleaning caches..."
rm -rf node_modules
rm -rf .next
rm -rf .turbo
rm -rf .cache

# Fix git
echo "4️⃣ Pulling latest code..."
git fetch --all
git checkout master 2>/dev/null || git checkout main 2>/dev/null
git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null
git clean -fdx

# Verify package.json
echo "5️⃣ Verifying package.json..."
if grep -q "<<<<<<< HEAD" package.json 2>/dev/null; then
    echo "⚠️  Merge conflict detected, forcing clean version..."
    git checkout HEAD -- package.json
fi

node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" || {
    echo "❌ Invalid package.json!"
    exit 1
}

echo "✅ package.json is valid"

# Install
echo "6️⃣ Installing dependencies..."
npm install --legacy-peer-deps

# Build
echo "7️⃣ Building application..."
npm run build

# Start PM2
echo "8️⃣ Starting with PM2..."
pm2 start ecosystem.config.json
pm2 save

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================"
pm2 list
echo ""
echo "📋 Logs: pm2 logs peeak"
echo "🔄 Restart: pm2 restart peeak"
echo "🛑 Stop: pm2 stop peeak"
