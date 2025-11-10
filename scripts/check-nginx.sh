#!/bin/bash

echo "🔍 Quick Nginx Check"
echo ""

# Check Nginx status
systemctl is-active nginx && echo "✅ Nginx is running" || echo "❌ Nginx is not running"

# Check app status
pm2 list | grep -q "online" && echo "✅ App is running" || echo "❌ App is not running"

# Check ports
echo ""
echo "Port 3000 (App):"
curl -s http://localhost:3000 > /dev/null && echo "✅ App responding on port 3000" || echo "❌ App not responding on port 3000"

echo ""
echo "Port 80 (HTTP):"
curl -s http://app.peeak.org > /dev/null && echo "✅ HTTP responding" || echo "❌ HTTP not responding"

echo ""
echo "Port 443 (HTTPS):"
curl -s -k https://app.peeak.org > /dev/null && echo "✅ HTTPS responding" || echo "❌ HTTPS not responding"

echo ""
echo "🔧 Quick fixes:"
echo "  - Restart Nginx: systemctl restart nginx"
echo "  - Check logs: tail -f /var/log/nginx/error.log"
echo "  - Full fix: bash scripts/fix-nginx.sh"
