# Peeak VPS Deployment Guide

## Prerequisites

- VPS server (Ubuntu 20.04+ recommended)
- Docker and Docker Compose installed
- Domain name pointed to your VPS IP
- SSL certificate (optional but recommended)

## Installation Steps

### 1. Install Docker on VPS

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group
sudo usermod -aG docker $USER
newgrp docker
\`\`\`

### 2. Upload Your Project

\`\`\`bash
# On your local machine, create a zip without node_modules
zip -r peeak.zip . -x "node_modules/*" -x ".next/*" -x ".git/*"

# Upload to VPS (replace with your VPS IP)
scp peeak.zip user@your-vps-ip:/home/user/

# SSH into VPS
ssh user@your-vps-ip

# Extract files
cd /home/user
unzip peeak.zip -d peeak
cd peeak
\`\`\`

### 3. Configure Environment Variables

\`\`\`bash
# Copy example env file
cp .env.example .env

# Edit with your actual values
nano .env
\`\`\`

### 4. Build and Run

\`\`\`bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
\`\`\`

### 5. Setup Nginx Reverse Proxy (Optional)

\`\`\`bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx config
sudo nano /etc/nginx/sites-available/peeak
\`\`\`

Add this configuration:

\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

Enable the site:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/peeak /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### 6. Setup SSL with Certbot (Optional)

\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is configured automatically
\`\`\`

## Useful Commands

\`\`\`bash
# View logs
docker-compose logs -f

# Restart container
docker-compose restart

# Stop containers
docker-compose down

# Rebuild and restart
docker-compose up -d --build

# Access container shell
docker exec -it peeak-app sh

# Check container status
docker ps
\`\`\`

## Updating Your App

\`\`\`bash
# Pull latest changes or upload new files
git pull  # if using git

# Rebuild and restart
./deploy.sh
\`\`\`

## Troubleshooting

### Container won't start
\`\`\`bash
docker-compose logs peeak
\`\`\`

### Check if port 3000 is in use
\`\`\`bash
sudo lsof -i :3000
\`\`\`

### Clear Docker cache
\`\`\`bash
docker system prune -a
\`\`\`

### Database connection issues
- Verify your Supabase URL and keys in .env
- Check if your VPS IP is allowed in Supabase dashboard

## Performance Optimization

### Enable Docker restart on boot
\`\`\`bash
sudo systemctl enable docker
\`\`\`

### Increase Docker memory limit (if needed)
Edit `/etc/docker/daemon.json`:
\`\`\`json
{
  "default-ulimits": {
    "nofile": {
      "Name": "nofile",
      "Hard": 64000,
      "Soft": 64000
    }
  }
}
\`\`\`

### Monitor container resources
\`\`\`bash
docker stats peeak-app
