# Peeak VPS Deployment - Quick Start

A condensed guide for experienced developers who want to deploy quickly.

## Prerequisites Checklist

- [ ] VPS with Ubuntu 22.04+ (2GB RAM minimum)
- [ ] Domain/subdomain DNS pointing to VPS IP
- [ ] Supabase project with database
- [ ] GitHub repository with Peeak code
- [ ] Environment variables ready

## 5-Minute Deployment

### 1. Initial VPS Setup

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y curl git nginx ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
\`\`\`

### 2. Deploy Application

\`\`\`bash
# Clone repository
cd /home
sudo mkdir -p peeak-app
sudo chown -R $USER:$USER peeak-app
cd peeak-app
git clone https://github.com/YOUR_USERNAME/peeak.git .

# Configure environment
cp .env.example .env
nano .env  # Fill in your actual values

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
docker-compose logs -f
\`\`\`

### 3. Configure Nginx

\`\`\`bash
# Create config
sudo nano /etc/nginx/sites-available/peeak
\`\`\`

Paste this configuration:

\`\`\`nginx
server {
    listen 80;
    server_name app.peeak.org;

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
        client_max_body_size 50M;
    }
}
\`\`\`

\`\`\`bash
# Enable site
sudo ln -s /etc/nginx/sites-available/peeak /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### 4. Install SSL

\`\`\`bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate
sudo certbot --nginx -d app.peeak.org

# Choose option 2 (redirect HTTP to HTTPS)
\`\`\`

### 5. Final Configuration

**Update Supabase:**
- Site URL: `https://app.peeak.org`
- Redirect URLs: `https://app.peeak.org/**`

**Test:**
- Visit `https://app.peeak.org`
- Try sign up/login

**Done!** 🚀

## Useful Commands

\`\`\`bash
# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Update
cd /home/peeak-app
git pull origin main
docker-compose up -d --build

# Stop
docker-compose down

# Check health
curl http://localhost:3000
\`\`\`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | `docker-compose restart && sudo systemctl restart nginx` |
| Port in use | `sudo lsof -i :3000` and kill process |
| DNS not resolving | Wait 10 mins, clear DNS cache |
| SSL fails | Check ports 80/443 open, domain resolves |

## Next Steps

- Set up monitoring: `docker stats`
- Configure backups: `./scripts/backup.sh`
- Enable log rotation
- Set up health checks: `./scripts/health-check.sh`

For detailed instructions, see [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
