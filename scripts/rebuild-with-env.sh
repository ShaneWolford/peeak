#!/bin/bash

set -e

echo "🔧 Rebuilding Peeak with environment variables..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your environment variables."
    exit 1
fi

# Load .env file
echo "📋 Loading .env file..."
export $(grep -v '^#' .env | xargs)

# Verify critical variables are set
echo "🔍 Verifying NEXT_PUBLIC variables..."
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is not set in .env"
    exit 1
fi

echo "✅ NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Remove old images to force rebuild
echo "🗑️  Removing old images..."
docker rmi peeak-peeak:latest 2>/dev/null || true
docker rmi $(docker images -q -f dangling=true) 2>/dev/null || true

# Build with explicit build args
echo "🏗️  Building Docker image with environment variables..."
docker compose build \
    --no-cache \
    --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
    --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" \
    --build-arg NEXT_PUBLIC_SITE_URL="$NEXT_PUBLIC_SITE_URL" \
    --build-arg NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL="$NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL"

# Start the container
echo "🚀 Starting container..."
docker compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for container to be ready..."
sleep 10

# Check if container is running
if docker ps | grep -q peeak-app; then
    echo "✅ Container is running!"
    
    # Verify environment variables inside container
    echo ""
    echo "🔍 Verifying environment variables inside container..."
    docker exec peeak-app sh -c 'echo "NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:0:30}..."'
    docker exec peeak-app sh -c 'echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."'
    
    echo ""
    echo "✅ Deployment complete!"
    echo "🌐 Visit: https://app.peeak.org"
    echo ""
    echo "📋 View logs: docker logs -f peeak-app"
else
    echo "❌ Container failed to start"
    echo "📋 Check logs: docker logs peeak-app"
    exit 1
fi
