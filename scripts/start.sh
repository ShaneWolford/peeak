#!/bin/bash

echo "🚀 Starting Peeak..."

cd /root/app/peeak

# Load environment variables
set -a
source .env
set +a

# Start with PM2 using ecosystem file
pm2 start ecosystem.config.json

# Save PM2 configuration
pm2 save

echo "✅ Peeak started successfully!"
echo ""
echo "Commands:"
echo "  pm2 logs peeak        - View logs"
echo "  pm2 monit             - Monitor app"
echo "  pm2 restart peeak     - Restart"
