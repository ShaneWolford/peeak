#!/bin/bash

echo "=== Peeak Diagnostics ==="
echo ""

echo "1. Checking Docker containers..."
docker ps -a | grep peeak

echo ""
echo "2. Checking port 3000..."
if netstat -tlnp | grep -q 3000; then
    echo "✓ Port 3000 is listening"
    netstat -tlnp | grep 3000
else
    echo "✗ Nothing listening on port 3000"
fi

echo ""
echo "3. Checking Nginx status..."
systemctl status nginx --no-pager | head -3

echo ""
echo "4. Testing Nginx config..."
nginx -t

echo ""
echo "5. Checking environment variables in container..."
if docker ps | grep -q peeak-app; then
    echo "Checking NEXT_PUBLIC vars..."
    docker exec peeak-app env | grep NEXT_PUBLIC || echo "✗ No NEXT_PUBLIC vars found"
else
    echo "✗ Container not running"
fi

echo ""
echo "6. Last 20 lines of app logs..."
docker logs --tail 20 peeak-app 2>&1 || echo "✗ Cannot read logs"

echo ""
echo "=== Diagnosis Complete ==="
