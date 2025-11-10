#!/bin/bash

echo "🚀 Simple Start (no build)"

cd /root/app/peeak

# Stop PM2
pm2 delete all 2>/dev/null || true

# Kill anything on port 3000
pkill -f "next" 2>/dev/null || true
sleep 2

# Check if .next exists
if [ ! -d ".next" ]; then
    echo "❌ No build found. Building first..."
    npm run build || exit 1
fi

# Start with PM2
pm2 start ecosystem.config.json
pm2 save

# Wait and check
sleep 3
if lsof -i :3000; then
    echo "✅ App started successfully"
    pm2 list
else
    echo "❌ App failed to start"
    pm2 logs peeak --lines 30
fi
