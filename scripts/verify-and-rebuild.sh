#!/bin/bash

set -e

echo "🔍 Verifying environment variables..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file with your Supabase credentials"
    exit 1
fi

# Check for required NEXT_PUBLIC variables
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=https://" .env; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL not properly set in .env"
    echo "It should look like: NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ" .env; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY not properly set in .env"
    echo "It should be a long JWT token starting with: eyJ"
    exit 1
fi

echo "✅ Environment variables look good!"
echo ""
echo "📦 Building Docker image with environment variables..."

# Source the .env file to make variables available
set -a
source .env
set +a

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Remove old images to ensure clean build
echo "🗑️  Removing old images..."
docker rmi peeak-peeak 2>/dev/null || true

# Build with no cache
echo "🔨 Building (this will take a few minutes)..."
docker compose build --no-cache

# Start the containers
echo "🚀 Starting containers..."
docker compose up -d

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Check if container is running
if docker ps | grep -q peeak-app; then
    echo "✅ Container is running!"
    echo ""
    echo "🔍 Verifying environment variables in container..."
    docker exec peeak-app printenv | grep NEXT_PUBLIC || echo "⚠️  NEXT_PUBLIC variables not found in container"
    echo ""
    echo "📝 View logs with: docker logs -f peeak-app"
    echo "🌐 Your app should be available at: https://app.peeak.org"
else
    echo "❌ Container failed to start!"
    echo "📝 Checking logs..."
    docker compose logs
    exit 1
fi
