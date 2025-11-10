#!/bin/bash

set -e

echo "🔧 Full Application Restart"
echo "======================================"

cd /root/app/peeak

echo ""
echo "1️⃣ Stopping everything..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pkill -f "next" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
sleep 2

echo ""
echo "2️⃣ Checking .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file missing!"
    echo "Create .env file with your variables first"
    exit 1
fi
echo "✅ .env file exists"

echo ""
echo "3️⃣ Pulling latest code..."
git fetch origin
git reset --hard origin/main 2>/dev/null || git reset --hard origin/master
git clean -fd

echo ""
echo "4️⃣ Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .turbo

echo ""
echo "5️⃣ Installing dependencies..."
npm install

echo ""
echo "6️⃣ Building application..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed!"
    echo "Check errors above and fix them"
    exit 1
fi

echo ""
echo "7️⃣ Starting with PM2..."
if [ -f ecosystem.config.json ]; then
    pm2 start ecosystem.config.json
else
    pm2 start npm --name "peeak" -- start
fi
pm2 save

echo ""
echo "8️⃣ Waiting for app to start..."
sleep 5

echo ""
echo "9️⃣ Checking if app is running..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ App is running on port 3000"
    pm2 list
    echo ""
    echo "🔟 Testing connection..."
    sleep 2
    curl -s http://localhost:3000 > /dev/null && echo "✅ App responds to HTTP requests" || echo "⚠️ App doesn't respond yet (may still be starting)"
else
    echo "❌ App failed to start!"
    echo "Checking logs..."
    pm2 logs peeak --lines 50 --nostream
    exit 1
fi

echo ""
echo "✅ Application restarted successfully!"
echo ""
echo "Test your site:"
echo "  curl -I https://app.peeak.org"
echo ""
echo "View logs:"
echo "  pm2 logs peeak"
