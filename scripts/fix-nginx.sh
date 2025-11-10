#!/bin/bash

echo "🔍 Diagnosing Nginx issues..."

# Check if Nginx is installed
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx is not installed"
    echo "Installing Nginx..."
    apt update
    apt install -y nginx
fi

# Check Nginx status
echo ""
echo "📊 Nginx Status:"
systemctl status nginx --no-pager

# Check if port 80 and 443 are in use
echo ""
echo "🔌 Port Status:"
echo "Port 80:"
lsof -i :80 || echo "Port 80 is free"
echo "Port 443:"
lsof -i :443 || echo "Port 443 is free"

# Check if app is running on port 3000
echo ""
echo "🚀 App Status (Port 3000):"
lsof -i :3000 || echo "❌ Nothing running on port 3000!"

# Check Nginx configuration
echo ""
echo "📝 Testing Nginx Configuration:"
nginx -t

# Check Nginx error logs
echo ""
echo "📋 Recent Nginx Errors:"
tail -n 20 /var/log/nginx/error.log 2>/dev/null || echo "No error log found"

# Check if site config exists
echo ""
echo "🔧 Site Configuration:"
if [ -f /etc/nginx/sites-available/peeak ]; then
    echo "✅ /etc/nginx/sites-available/peeak exists"
else
    echo "❌ /etc/nginx/sites-available/peeak missing"
fi

if [ -L /etc/nginx/sites-enabled/peeak ]; then
    echo "✅ /etc/nginx/sites-enabled/peeak symlink exists"
else
    echo "❌ /etc/nginx/sites-enabled/peeak symlink missing"
fi

# Check SSL certificates
echo ""
echo "🔒 SSL Certificate Status:"
if [ -d /etc/letsencrypt/live/app.peeak.org ]; then
    echo "✅ SSL certificates exist"
    ls -la /etc/letsencrypt/live/app.peeak.org/
else
    echo "❌ SSL certificates not found"
fi

echo ""
echo "🔧 Attempting to fix common issues..."

# Stop Nginx
systemctl stop nginx

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Create proper Nginx configuration
cat > /etc/nginx/sites-available/peeak << 'EOF'
upstream peeak_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP -> HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name app.peeak.org;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.peeak.org;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/app.peeak.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.peeak.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Increase timeouts for Next.js
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Buffer settings
    proxy_buffer_size 128k;
    proxy_buffers 4 256k;
    proxy_busy_buffers_size 256k;

    location / {
        proxy_pass http://peeak_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /_next/static {
        proxy_pass http://peeak_backend;
        proxy_cache_valid 60m;
    }
}
EOF

echo "✅ Nginx config created"

# Create symlink
ln -sf /etc/nginx/sites-available/peeak /etc/nginx/sites-enabled/peeak

# Test configuration
echo ""
echo "🧪 Testing new configuration..."
if nginx -t; then
    echo "✅ Nginx configuration is valid"
    
    # Start Nginx
    systemctl start nginx
    systemctl enable nginx
    
    echo ""
    echo "✅ Nginx restarted successfully"
    
    # Show status
    echo ""
    systemctl status nginx --no-pager
    
    echo ""
    echo "🎉 Nginx should now be working!"
    echo ""
    echo "Test with: curl -I http://app.peeak.org"
    echo "Or visit: https://app.peeak.org"
else
    echo "❌ Nginx configuration has errors"
    echo "Please check the output above"
fi
