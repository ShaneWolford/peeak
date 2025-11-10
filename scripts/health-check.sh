#!/bin/bash

# Health Check Script for Peeak
# Checks if the application is running and responding

echo "🔍 Checking Peeak application health..."

# Check if Docker container is running
if ! docker ps | grep -q peeak-app; then
    echo "❌ Container is not running!"
    exit 1
fi

# Check if application responds
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$RESPONSE" -eq 200 ]; then
    echo "✅ Application is healthy (HTTP $RESPONSE)"
    exit 0
else
    echo "⚠️  Application returned HTTP $RESPONSE"
    exit 1
fi
