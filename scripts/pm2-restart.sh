#!/bin/bash

# Quick script to restart PM2
echo "🔄 Restarting PM2..."
pm2 restart peeak-app
echo "✅ Restarted!"
pm2 list
