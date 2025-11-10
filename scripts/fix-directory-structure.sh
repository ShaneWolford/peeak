#!/bin/bash

set -e

echo "🔍 Checking directory structure..."

# Check if we're in the nested peeak/peeak situation
if [ -d "/root/app/peeak/peeak" ]; then
    echo "❌ Found nested directory structure at /root/app/peeak/peeak"
    echo "🔧 Fixing directory structure..."
    
    # Stop PM2
    echo "⏸️  Stopping PM2..."
    pm2 stop all || true
    pm2 delete all || true
    pm2 kill || true
    
    # Move to parent directory
    cd /root/app
    
    # Create a temporary backup name
    mv peeak peeak-old
    
    # Move the inner peeak folder out
    mv peeak-old/peeak peeak-new
    
    # Remove the old directory
    rm -rf peeak-old
    
    # Rename to correct name
    mv peeak-new peeak
    
    echo "✅ Directory structure fixed!"
else
    echo "✅ Directory structure is correct"
fi

# Navigate to the correct directory
cd /root/app/peeak

echo "📦 Installing dependencies..."
npm install

echo "🏗️  Building application..."
npm run build

echo "🚀 Starting PM2 with ecosystem config..."
pm2 start ecosystem.config.json
pm2 save
pm2 startup

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status with: pm2 status"
echo "📋 View logs with: pm2 logs peeak"
