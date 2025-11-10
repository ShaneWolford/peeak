#!/bin/bash

# Production monitoring script

echo "📊 Peeak Production Status"
echo "=========================="
echo ""

# Container status
echo "🐳 Docker Containers:"
docker ps --filter "name=peeak"
echo ""

# Resource usage
echo "💾 Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" peeak-app
echo ""

# Disk space
echo "💿 Disk Space:"
df -h /
echo ""

# Recent logs
echo "📝 Recent Logs (last 20 lines):"
docker logs --tail=20 peeak-app
echo ""

# Check if site is accessible
echo "🌐 Site Health Check:"
curl -s -o /dev/null -w "Status: %{http_code}\nTime: %{time_total}s\n" https://app.peeak.org

echo ""
echo "✅ Monitoring complete"
