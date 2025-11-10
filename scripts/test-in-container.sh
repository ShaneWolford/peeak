#!/bin/bash

# Test if environment variables are available inside the running container

echo "=== Testing Environment Variables Inside Container ==="
echo ""

# Check if container is running
if ! docker ps | grep -q peeak-app; then
    echo "❌ Container 'peeak-app' is not running!"
    echo "Start it with: docker compose up -d"
    exit 1
fi

echo "✅ Container is running"
echo ""

echo "📋 NEXT_PUBLIC variables (must be present for app to work):"
docker exec peeak-app env | grep NEXT_PUBLIC || echo "❌ No NEXT_PUBLIC variables found!"

echo ""
echo "📋 Server-side variables:"
docker exec peeak-app env | grep -E "SUPABASE_URL|STRIPE|BLOB" || echo "⚠️  Some server variables may be missing"

echo ""
echo "=== Test Complete ==="
