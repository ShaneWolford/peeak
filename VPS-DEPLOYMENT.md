# VPS Deployment Guide

## One-Command Deploy

Run this on your VPS to deploy the latest code:

\`\`\`bash
cd /root/app/peeak && bash deploy.sh
\`\`\`

## What It Does

1. Stops all PM2 processes
2. Clears port 3000
3. Removes all caches and builds
4. Pulls latest code from GitHub
5. Validates package.json
6. Installs dependencies
7. Builds the application
8. Starts with PM2

## Quick Commands

\`\`\`bash
# View logs
pm2 logs peeak

# Restart (without rebuild)
pm2 restart peeak

# Stop
pm2 stop peeak

# Check status
pm2 status

# View last 50 log lines
pm2 logs peeak --lines 50
\`\`\`

## Troubleshooting

If deployment fails:

\`\`\`bash
cd /root/app/peeak

# Nuclear option - completely reset
pm2 kill
rm -rf node_modules .next .turbo
git reset --hard origin/master
git clean -fdx
npm install
npm run build
pm2 start ecosystem.config.json
pm2 save
\`\`\`

## Environment Variables

Make sure `.env` file exists with:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- (and all other required variables)

## After Deployment

The app runs on port 3000. Nginx proxies requests from `https://app.peeak.org` to `http://localhost:3000`.

Check if it's running:
\`\`\`bash
curl http://localhost:3000
