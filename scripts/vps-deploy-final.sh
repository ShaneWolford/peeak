#!/bin/bash

set -e  # Exit on any error

echo "🚀 VPS Deployment Script - FINAL VERSION"
echo "=========================================="

cd /root/app/peeak

# Stop PM2
echo "1️⃣ Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Kill anything on port 3000
echo "2️⃣ Clearing port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Clean everything
echo "3️⃣ Nuclear clean..."
rm -rf node_modules
rm -rf .next
rm -rf .turbo
rm -rf .cache
rm -rf dist
rm -rf build

# Fix git state
echo "4️⃣ Fixing git state..."
git fetch --all
git checkout master 2>/dev/null || git checkout main 2>/dev/null || git checkout -b master
git reset --hard origin/master 2>/dev/null || git reset --hard origin/main 2>/dev/null
git clean -fdx

# Verify package.json is clean
echo "5️⃣ Verifying package.json..."
if grep -q "<<<<<<< HEAD" package.json; then
    echo "❌ Merge conflict detected! Forcing clean package.json..."
    git checkout origin/master -- package.json 2>/dev/null || git checkout origin/main -- package.json 2>/dev/null
fi

# Verify package.json is valid JSON
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" || {
    echo "❌ Invalid package.json! Aborting..."
    exit 1
}

echo "✅ package.json is valid"

# Install dependencies
echo "6️⃣ Installing dependencies..."
npm install

# Build
echo "7️⃣ Building..."
npm run build

# Start with PM2
echo "8️⃣ Starting with PM2..."
pm2 start ecosystem.config.json
pm2 save

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "======================"
pm2 list
echo ""
echo "View logs: pm2 logs peeak"
echo "Restart: pm2 restart peeak"
echo "Stop: pm2 stop peeak"
