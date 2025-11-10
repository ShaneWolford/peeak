#!/bin/bash

echo "🔒 Setting up SSL for app.peeak.org"

# Install certbot
apt update
apt install -y certbot python3-certbot-nginx

# Stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot certonly --standalone -d app.peeak.org --non-interactive --agree-tos --email admin@peeak.org

# Start nginx
systemctl start nginx

echo "✅ SSL setup complete!"
echo "Run: bash scripts/fix-nginx.sh to apply the configuration"
