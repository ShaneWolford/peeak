#!/bin/bash

echo "🔧 Attempting to fix 502 error..."

# Stop everything
echo "Stopping containers..."
cd /root/app/peeak
docker compose down

# Check if .env exists and has values
if [ ! -f .env ]; then
    echo "✗ .env file not found!"
    echo "Please create .env file with your configuration"
    exit 1
fi

# Show env vars
echo ""
echo "Checking environment variables..."
if grep -q "your_value_here" .env; then
    echo "✗ .env contains placeholder values!"
    echo "Please update .env with real values"
    exit 1
fi

echo "✓ .env looks good"

# Rebuild and restart
echo ""
echo "Rebuilding Docker image..."
docker compose build --no-cache

echo ""
echo "Starting containers..."
docker compose up -d

echo ""
echo "Waiting for app to start..."
sleep 10

# Check status
echo ""
if docker ps | grep -q peeak-app; then
    echo "✓ Container is running"
    
    # Wait for app to be ready
    echo "Waiting for app to be ready..."
    sleep 5
    
    # Test local connection
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✓ App responding on port 3000"
    else
        echo "✗ App not responding yet, check logs:"
        docker logs --tail 30 peeak-app
    fi
else
    echo "✗ Container failed to start"
    docker logs peeak-app
fi

echo ""
echo "Testing Nginx..."
systemctl restart nginx
nginx -t

echo ""
echo "=== Fix attempt complete ==="
echo "Try accessing https://app.peeak.org now"
