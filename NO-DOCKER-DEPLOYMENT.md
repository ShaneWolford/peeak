# Deploy Peeak Without Docker

This guide shows you how to deploy Peeak directly on your VPS using Node.js and PM2, which properly loads .env files without Docker complexity.

## Prerequisites

- Fresh Ubuntu VPS
- Root access
- Domain pointing to VPS IP

## Step 1: Install Node.js and PM2

\`\`\`bash
cd /root/app/peeak

# Make script executable
chmod +x scripts/install-nodejs.sh

# Run installation
bash scripts/install-nodejs.sh
\`\`\`

This installs:
- Node.js 20.x
- pnpm (package manager)
- PM2 (process manager)

## Step 2: Set Up Your .env File

\`\`\`bash
cd /root/app/peeak

# Create .env file
nano .env
\`\`\`

Add all your environment variables (copy from Vercel or Supabase):

\`\`\`env
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_URL=https://xxxxx.supabase.co

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Blob Storage
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxx

# Site URL
NEXT_PUBLIC_SITE_URL=https://app.peeak.org

# Other vars...
\`\`\`

Save with `Ctrl+X`, `Y`, `Enter`

## Step 3: Deploy Application

\`\`\`bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
bash scripts/deploy-no-docker.sh
\`\`\`

This will:
1. Load your .env file
2. Verify environment variables
3. Install dependencies with pnpm
4. Build the Next.js app
5. Start it with PM2
6. Set up auto-restart on boot

## Step 4: Configure Nginx (Same as Before)

\`\`\`bash
# Install Nginx
apt install nginx -y

# Create config
nano /etc/nginx/sites-available/peeak
\`\`\`

Add:

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

Enable and restart:

\`\`\`bash
ln -s /etc/nginx/sites-available/peeak /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
\`\`\`

## Step 5: Install SSL Certificate

\`\`\`bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d app.peeak.org
\`\`\`

## Useful Commands

**View logs:**
\`\`\`bash
pm2 logs peeak
pm2 logs peeak --lines 100
\`\`\`

**Monitor app:**
\`\`\`bash
pm2 monit
pm2 status
\`\`\`

**Restart app:**
\`\`\`bash
bash scripts/restart.sh
# or
pm2 restart peeak
\`\`\`

**Stop app:**
\`\`\`bash
bash scripts/stop.sh
# or
pm2 stop peeak
\`\`\`

**Update app:**
\`\`\`bash
bash scripts/update-no-docker.sh
\`\`\`

**Check environment variables:**
\`\`\`bash
pm2 env peeak
\`\`\`

**Delete app (if needed):**
\`\`\`bash
pm2 delete peeak
pm2 save
\`\`\`

## Auto-Start on Boot

PM2 automatically sets up the app to start when the server reboots:

\`\`\`bash
# View startup script
pm2 startup

# Save current process list
pm2 save
\`\`\`

## Troubleshooting

**App won't start:**
\`\`\`bash
# Check logs
pm2 logs peeak --err

# Try running manually to see errors
cd /root/app/peeak
pnpm run build
pnpm start
\`\`\`

**Port 3000 already in use:**
\`\`\`bash
# Find what's using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or stop Docker if still running
docker compose down
\`\`\`

**Environment variables not loading:**
\`\`\`bash
# Verify .env file
cat .env | grep NEXT_PUBLIC

# Manually load and start
cd /root/app/peeak
set -a && source .env && set +a
pm2 restart peeak --update-env
\`\`\`

**Build errors:**
\`\`\`bash
# Clear cache and rebuild
rm -rf .next
pnpm install
pnpm run build
pm2 restart peeak
\`\`\`

## Advantages Over Docker

✅ Direct .env file loading - no build-time vs runtime confusion
✅ Faster deployments - no image building
✅ Easier debugging - direct access to logs and processes
✅ Less memory usage - no Docker overhead
✅ Simpler updates - just `git pull` and restart

## Migration from Docker

If you have Docker running:

\`\`\`bash
# Stop and remove Docker containers
docker compose down

# Follow deployment steps above
bash scripts/deploy-no-docker.sh
\`\`\`

Your Nginx and SSL setup stays the same.
