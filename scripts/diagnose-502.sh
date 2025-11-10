#!/bin/bash

echo "=== Diagnosing 502 Bad Gateway ==="
echo ""

echo "1. Checking if app is running on port 3000..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Something is listening on port 3000"
    lsof -i :3000
else
    echo "❌ Nothing is listening on port 3000"
fi
echo ""

echo "2. Checking PM2 status..."
pm2 list
echo ""

echo "3. Checking PM2 logs (last 30 lines)..."
pm2 logs peeak --lines 30 --nostream
echo ""

echo "4. Checking if Next.js built successfully..."
if [ -d ".next" ]; then
    echo "✅ .next directory exists"
    ls -lah .next
else
    echo "❌ .next directory missing - build failed"
fi
echo ""

echo "5. Checking package.json for syntax errors..."
if node -e "require('./package.json')"; then
    echo "✅ package.json is valid"
else
    echo "❌ package.json has syntax errors"
fi
echo ""

echo "6. Testing manual start..."
echo "Running: npm run start (will try for 5 seconds)"
timeout 5 npm run start &
sleep 6
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ Manual start works"
    pkill -f "next start"
else
    echo "❌ Manual start failed"
fi
echo ""

echo "7. Checking Nginx config..."
nginx -t
echo ""

echo "=== Recommended Actions ==="
if ! lsof -i :3000 > /dev/null 2>&1; then
    echo "❌ App is NOT running. Try:"
    echo "   bash scripts/full-restart.sh"
fi
