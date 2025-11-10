#!/bin/bash

echo "🔄 Quick restart (no rebuild)..."

pm2 restart peeak

if [ $? -eq 0 ]; then
  echo "✅ Restarted successfully!"
  pm2 logs peeak --lines 20
else
  echo "❌ Restart failed"
  exit 1
fi
