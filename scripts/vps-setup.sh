#!/bin/bash

set -e

echo "=========================================="
echo "  Peeak VPS Setup Script"
echo "=========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo "Please run as root (use: sudo bash scripts/vps-setup.sh)"
  exit 1
fi

echo "Step 1: Updating system packages..."
apt update && apt upgrade -y

echo ""
echo "Step 2: Installing essential packages..."
apt install -y curl git nano ufw

echo ""
echo "Step 3: Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
else
    echo "Docker already installed: $(docker --version)"
fi

echo ""
echo "Step 4: Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    echo "Docker Compose plugin not found. Installing..."
    apt install -y docker-compose-plugin
else
    echo "Docker Compose already installed: $(docker compose version)"
fi

echo ""
echo "Step 5: Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
else
    echo "Nginx already installed: $(nginx -v)"
fi

echo ""
echo "Step 6: Configuring firewall..."
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo ""
echo "Step 7: Installing Certbot for SSL..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
else
    echo "Certbot already installed: $(certbot --version)"
fi

echo ""
echo "=========================================="
echo "  VPS Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and fill in your values"
echo "2. Run: bash deploy.sh"
echo "3. Configure domain with: app.peeak.org -> $(curl -s ifconfig.me)"
echo "4. Get SSL: certbot --nginx -d app.peeak.org"
echo ""
