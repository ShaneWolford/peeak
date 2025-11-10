# Peeak VPS Deployment - Quick Reference

## Deploy Latest Code

\`\`\`bash
cd /root/app/peeak && bash deploy.sh
\`\`\`

This is the **ONLY** command you need to deploy. It handles everything automatically.

## What Gets Deployed

The script:
- Stops PM2
- Clears all caches
- Pulls latest code from GitHub (master branch)
- Validates package.json
- Installs dependencies
- Builds the app
- Starts PM2

## After Deployment

\`\`\`bash
# Check if running
pm2 status

# View live logs
pm2 logs peeak

# Quick restart (no rebuild)
pm2 restart peeak

# Stop the app
pm2 stop peeak
\`\`\`

## If Something Goes Wrong

\`\`\`bash
# View error logs
tail -f /root/.pm2/logs/peeak-error.log

# Check what's on port 3000
lsof -i:3000

# Kill port 3000 and restart
lsof -ti:3000 | xargs kill -9
pm2 restart peeak

# Nuclear option - full reset
cd /root/app/peeak
pm2 kill
rm -rf node_modules .next .turbo
git reset --hard origin/master
npm install
npm run build
pm2 start ecosystem.config.json
pm2 save
\`\`\`

## File Locations

- App: `/root/app/peeak`
- Logs: `/root/.pm2/logs/`
- Config: `/root/app/peeak/ecosystem.config.json`
- Nginx: `/etc/nginx/sites-available/peeak`

## Environment Variables

Located in `/root/app/peeak/.env`

Required variables:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_URL
- SUPABASE_ANON_KEY
- (and others)

## Common Issues

**Build fails with package.json error:**
\`\`\`bash
cd /root/app/peeak
git checkout HEAD -- package.json
bash deploy.sh
\`\`\`

**Port 3000 already in use:**
\`\`\`bash
lsof -ti:3000 | xargs kill -9
pm2 restart peeak
\`\`\`

**PM2 won't start:**
\`\`\`bash
pm2 kill
pm2 start ecosystem.config.json
pm2 save
\`\`\`

## Deployment Complete When You See:

\`\`\`
✅ DEPLOYMENT COMPLETE!
======================
┌────┬───────┬─────────┬──────┬────────┬─────────┬─────────┐
│ id │ name  │ mode    │ ↺    │ status │ cpu     │ memory  │
├────┼───────┼─────────┼──────┼────────┼─────────┼─────────┤
│ 0  │ peeak │ fork    │ 0    │ online │ 0%      │ 50.0mb  │
└────┴───────┴─────────┴──────┴────────┴─────────┴─────────┘
\`\`\`

Your app is live at: https://app.peeak.org
