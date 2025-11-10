# Peeak Social Media Platform - Complete VPS Deployment Guide

This guide covers deploying Peeak on a fresh VPS server from scratch, including domain setup, SSL configuration, and production optimization.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: VPS Initial Setup](#part-1-vps-initial-setup)
3. [Part 2: Clone and Configure Application](#part-2-clone-and-configure-application)
4. [Part 3: Deploy with Docker](#part-3-deploy-with-docker)
5. [Part 4: Domain and SSL Setup](#part-4-domain-and-ssl-setup)
6. [Part 5: Production Optimization](#part-5-production-optimization)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance](#maintenance)

---

## Prerequisites

### What You Need

- **VPS Server** (Ubuntu 22.04 LTS or Debian 12 recommended)
  - Minimum: 2GB RAM, 2 CPU cores, 20GB storage
  - Recommended: 4GB RAM, 2-4 CPU cores, 40GB storage
  - Provider: DigitalOcean, Linode, Vultr, AWS EC2, etc.

- **Domain Name** (e.g., `app.peeak.org`)
  - Access to DNS settings

- **GitHub Account**
  - Repository with Peeak code pushed

- **Supabase Account**
  - Project created with database
  - API keys ready

- **Vercel Blob Account** (for media storage)
  - Blob token ready

- **Stripe Account** (optional, for payments)
  - API keys ready

---

## Part 1: VPS Initial Setup

### Step 1.1: Connect to Your VPS

From your Windows computer, open PowerShell or Command Prompt:

\`\`\`bash
# Connect via SSH (use IP provided by your VPS provider)
ssh root@YOUR_VPS_IP

# Or with username
ssh username@YOUR_VPS_IP
\`\`\`

Enter your password when prompted.

### Step 1.2: Update System

\`\`\`bash
# Update package lists
sudo apt update

# Upgrade installed packages
sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git nano ufw
\`\`\`

### Step 1.3: Create Non-Root User (Recommended)

**Option A: Deploy as Root (Simplest)**

If you're logged in as root, you can skip user creation and deploy directly:

\`\`\`bash
# Already logged in as root? Skip to Docker installation
whoami
# If shows "root", continue with next steps
\`\`\`

**Option B: Create Non-Root User (More Secure)**

\`\`\`bash
# Create new user
adduser peeak

# Add to sudo group
usermod -aG sudo peeak

# Switch to new user
su - peeak

# Verify sudo access
sudo whoami
# Should output "root"
\`\`\`

**Note:** If you get "peeak is not in the sudoers file" error later:
1. Switch back to root: `su -` or `ssh root@YOUR_VPS_IP`
2. Add user to sudo: `usermod -aG sudo peeak`
3. Log out and back in for changes to take effect

### Step 1.4: Configure Firewall

\`\`\`bash
# Allow SSH (IMPORTANT: Do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
\`\`\`

### Step 1.5: Install Docker

\`\`\`bash
# Download Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh

# Run installation
sudo sh get-docker.sh

# Add your user to docker group (no sudo needed for docker commands)
sudo usermod -aG docker $USER

# Apply group changes (or logout and login again)
newgrp docker

# Verify installation
docker --version
\`\`\`

### Step 1.6: Install Docker Compose

\`\`\`bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
\`\`\`

### Step 1.7: Install Nginx

\`\`\`bash
# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
\`\`\`

---

## Part 2: Clone and Configure Application

### Step 2.1: Create Application Directory

\`\`\`bash
# Navigate to home directory
cd /home

# Create app directory (if using root, use /opt instead)
sudo mkdir -p /home/peeak-app
sudo chown -R $USER:$USER /home/peeak-app
cd /home/peeak-app
\`\`\`

### Step 2.2: Clone GitHub Repository

\`\`\`bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/peeak.git .

# Verify files
ls -la
\`\`\`

**For Private Repositories:**
\`\`\`bash
# You'll need a GitHub Personal Access Token
# Go to: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
# Generate token with 'repo' scope

# Clone with token
git clone https://YOUR_TOKEN@github.com/YOUR_USERNAME/peeak.git .
\`\`\`

### Step 2.3: Configure Environment Variables

\`\`\`bash
# Copy example env file
cp .env.example .env

# Edit environment variables
nano .env
\`\`\`

**Fill in your actual values:**

\`\`\`env
# Supabase Configuration
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration
SUPABASE_POSTGRES_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
SUPABASE_POSTGRES_PRISMA_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true
SUPABASE_POSTGRES_URL_NON_POOLING=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Stripe Configuration (Optional)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxxxxxx

# Site Configuration (Update with your domain)
NEXT_PUBLIC_SITE_URL=https://app.peeak.org
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://app.peeak.org/auth/callback
\`\`\`

**Save:** Press `Ctrl + X`, then `Y`, then `Enter`

**Important:** Never commit `.env` to GitHub. It's already in `.gitignore`.

### Step 2.4: Verify Files

\`\`\`bash
# Check if all necessary files exist
ls -la

# You should see:
# - Dockerfile
# - docker-compose.yml
# - .env
# - app/
# - components/
# - public/
# - package.json
# - next.config.mjs
\`\`\`

---

## Part 3: Deploy with Docker

### Step 3.1: Build Docker Image

\`\`\`bash
# Make sure you're in the app directory
cd /home/peeak-app

# Build the Docker image (this takes 5-10 minutes)
docker-compose build

# Monitor the build process
# You should see multiple stages: deps, builder, runner
\`\`\`

### Step 3.2: Start Application

\`\`\`bash
# Start the application in detached mode
docker-compose up -d

# Check if container is running
docker-compose ps

# Should show:
# NAME         STATUS    PORTS
# peeak-app    Up        0.0.0.0:3000->3000/tcp
\`\`\`

### Step 3.3: View Logs

\`\`\`bash
# View real-time logs
docker-compose logs -f

# Exit logs with Ctrl + C

# Check for errors
docker-compose logs | grep -i error
\`\`\`

### Step 3.4: Test Application

\`\`\`bash
# Test if app responds
curl http://localhost:3000

# You should see HTML output
\`\`\`

---

## Part 4: Domain and SSL Setup

### Step 4.1: Configure DNS

Go to your DNS provider (where you registered `peeak.org`):

#### Add A Record for Subdomain

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | app | YOUR_VPS_IP | 3600 |

**Example:**
- Type: `A`
- Name: `app` (this creates `app.peeak.org`)
- Value: `123.45.67.89` (your VPS IP)
- TTL: `3600` (1 hour)

**For Cloudflare users:** Turn off proxy (grey cloud) initially.

**Wait 5-10 minutes for DNS propagation.**

### Step 4.2: Test DNS Resolution

\`\`\`bash
# Check if domain points to your VPS
nslookup app.peeak.org

# Should show your VPS IP
ping app.peeak.org
\`\`\`

### Step 4.3: Configure Nginx

\`\`\`bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/peeak
\`\`\`

**Add this configuration:**

\`\`\`nginx
server {
    listen 80;
    listen [::]:80;
    
    server_name app.peeak.org;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy to Next.js Docker container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        
        # WebSocket support for real-time features
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Forward client info
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Increase body size for media uploads (50MB)
        client_max_body_size 50M;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
\`\`\`

**Save:** `Ctrl + X`, `Y`, `Enter`

### Step 4.4: Enable Nginx Site

\`\`\`bash
# Remove default site (if exists)
sudo rm /etc/nginx/sites-enabled/default

# Enable Peeak site
sudo ln -s /etc/nginx/sites-available/peeak /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Should show: "syntax is ok" and "test is successful"

# Restart Nginx
sudo systemctl restart nginx
\`\`\`

### Step 4.5: Test HTTP Access

Open browser and visit:
\`\`\`
http://app.peeak.org
\`\`\`

You should see your Peeak application!

### Step 4.6: Install SSL Certificate (HTTPS)

\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d app.peeak.org

# Follow prompts:
# 1. Enter email address (for renewal notifications)
# 2. Agree to terms of service: Y
# 3. Share email with EFF: N (optional)
# 4. Redirect HTTP to HTTPS: 2 (Yes, recommended)
\`\`\`

Certbot will automatically:
- Obtain SSL certificates from Let's Encrypt
- Update Nginx configuration for HTTPS
- Set up auto-renewal (certs expire every 90 days)

### Step 4.7: Test HTTPS Access

Open browser and visit:
\`\`\`
https://app.peeak.org
\`\`\`

Should work with green padlock icon!

Test auto-redirect:
\`\`\`
http://app.peeak.org
\`\`\`

Should automatically redirect to `https://app.peeak.org`

### Step 4.8: Verify SSL Auto-Renewal

\`\`\`bash
# Test renewal process (dry run)
sudo certbot renew --dry-run

# Should show: "Congratulations, all simulated renewals succeeded"
\`\`\`

---

## Part 5: Production Optimization

### Step 5.1: Update Supabase Settings

Go to [Supabase Dashboard](https://supabase.com/dashboard):

1. **Select your project**
2. **Settings → Authentication → URL Configuration**

Update:
- **Site URL:** `https://app.peeak.org`
- **Redirect URLs:** Add these:
  - `https://app.peeak.org/**`
  - `https://app.peeak.org/auth/callback`

**Save changes.**

### Step 5.2: Test Authentication

1. Visit `https://app.peeak.org`
2. Try signing up/logging in
3. Check if email confirmation works
4. Verify redirect after login

### Step 5.3: Enable Auto-Start on Reboot

\`\`\`bash
# Docker containers will auto-restart due to "unless-stopped" policy

# Verify Docker starts on boot
sudo systemctl enable docker

# Verify Nginx starts on boot
sudo systemctl enable nginx
\`\`\`

### Step 5.4: Set Up Log Rotation

\`\`\`bash
# Create log rotation config
sudo nano /etc/logrotate.d/docker-containers
\`\`\`

Add:
\`\`\`
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
\`\`\`

### Step 5.5: Configure Monitoring (Optional)

\`\`\`bash
# View resource usage
docker stats peeak-app

# Set up health check monitoring
# Add to crontab for automated health checks
crontab -e
\`\`\`

Add this line:
\`\`\`
*/5 * * * * curl -f http://localhost:3000/ || systemctl restart docker
\`\`\`

---

## Troubleshooting

### Application Not Starting

\`\`\`bash
# Check container status
docker-compose ps

# View detailed logs
docker-compose logs -f

# Restart container
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose up -d --build
\`\`\`

### 502 Bad Gateway Error

**Check if Docker container is running:**
\`\`\`bash
docker-compose ps

# Should show "Up" status
\`\`\`

**Restart services:**
\`\`\`bash
docker-compose restart
sudo systemctl restart nginx
\`\`\`

### Domain Not Resolving

\`\`\`bash
# Check DNS
nslookup app.peeak.org

# Clear DNS cache (on Windows client)
ipconfig /flushdns

# Check from different DNS server
nslookup app.peeak.org 8.8.8.8
\`\`\`

### SSL Certificate Issues

\`\`\`bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx config
sudo nginx -t
\`\`\`

### Database Connection Errors

**Check environment variables:**
\`\`\`bash
cat .env | grep SUPABASE

# Restart with new env vars
docker-compose down
docker-compose up -d
\`\`\`

**Test database connection:**
\`\`\`bash
# Enter container
docker exec -it peeak-app sh

# Check env vars inside container
env | grep SUPABASE
\`\`\`

### Out of Memory

\`\`\`bash
# Check memory usage
free -h

# Check Docker stats
docker stats

# Add swap space if needed
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
\`\`\`

### Port Already in Use

\`\`\`bash
# Check what's using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 PID

# Or change port in docker-compose.yml
# ports:
#   - "3001:3000"
\`\`\`

---

## Maintenance

### Updating Application

\`\`\`bash
# Navigate to app directory
cd /home/peeak-app

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# View logs
docker-compose logs -f
\`\`\`

### Backup Database

Your database is on Supabase, which handles backups automatically. For additional backups:

\`\`\`bash
# Export database
pg_dump $SUPABASE_POSTGRES_URL > backup-$(date +%Y%m%d).sql

# Store backups securely
\`\`\`

### Monitoring Logs

\`\`\`bash
# View application logs
docker-compose logs -f

# View Nginx access logs
sudo tail -f /var/log/nginx/access.log

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -f
\`\`\`

### Security Updates

\`\`\`bash
# Update system packages monthly
sudo apt update
sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
\`\`\`

### Disk Space Management

\`\`\`bash
# Check disk usage
df -h

# Clean Docker cache
docker system prune -a

# Clean old logs
sudo journalctl --vacuum-time=7d
\`\`\`

---

## Quick Reference Commands

\`\`\`bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# Restart application
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild application
docker-compose up -d --build

# Check container status
docker-compose ps

# Enter container
docker exec -it peeak-app sh

# Restart Nginx
sudo systemctl restart nginx

# Test Nginx config
sudo nginx -t

# Renew SSL certificate
sudo certbot renew

# Check SSL status
sudo certbot certificates
\`\`\`

---

## Support

If you encounter issues:

1. Check logs: `docker-compose logs -f`
2. Verify environment variables: `cat .env`
3. Test connectivity: `curl http://localhost:3000`
4. Check DNS: `nslookup app.peeak.org`
5. Review Nginx config: `sudo nginx -t`

---

**Deployment Complete!** 🚀

Your Peeak social media platform should now be live at `https://app.peeak.org`
