#!/bin/bash

set -e

echo "🚀 Starting Peeak deployment (without Docker)..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with your environment variables"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo "✅ Environment variables loaded"

# Verify critical variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not set in .env"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not set in .env"
    exit 1
fi

echo "✅ Critical environment variables verified"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the application
echo "🔨 Building application..."
pnpm run build

# Stop existing PM2 process if running
echo "🛑 Stopping existing process..."
pm2 delete peeak 2>/dev/null || true

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 start pnpm --name peeak -- start

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd -u root --hp /root

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Useful commands:"
echo "  pm2 logs peeak        - View logs"
echo "  pm2 restart peeak     - Restart app"
echo "  pm2 stop peeak        - Stop app"
echo "  pm2 status            - Check status"
echo ""
