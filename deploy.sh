#!/bin/bash

# Peeak Deployment Script
# Usage: ./deploy.sh

set -e

echo "🚀 Starting Peeak deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with your environment variables."
    echo "Copy .env.example to .env and fill in your values."
    exit 1
fi

# Check for required environment variables
echo "🔍 Checking required environment variables..."
source .env

REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables:"
    printf '   - %s\n' "${MISSING_VARS[@]}"
    exit 1
fi

echo "✅ All required environment variables present"

# Stop and remove old containers
echo "🛑 Stopping existing containers..."
docker compose down || true

# Build the new image with build args
echo "🔨 Building Docker image..."
docker compose build --no-cache

# Start the containers
echo "▶️  Starting containers..."
docker compose up -d

# Wait for container to be healthy
echo "⏳ Waiting for container to be healthy..."
sleep 5

# Check if container is running
if docker ps | grep -q peeak-app; then
    echo "✅ Container is running!"
    
    # Verify environment variables inside container
    echo ""
    echo "🔍 Verifying environment variables in container..."
    docker exec peeak-app env | grep NEXT_PUBLIC || echo "⚠️  NEXT_PUBLIC variables not found"
    
    echo ""
    echo "✅ Deployment complete!"
    echo "🌐 Application should be accessible at: http://localhost:3000"
    echo ""
    echo "📋 View logs with: docker compose logs -f"
    echo "🛑 Stop with: docker compose down"
else
    echo "❌ Container failed to start!"
    echo "📋 Checking logs..."
    docker compose logs
    exit 1
fi
