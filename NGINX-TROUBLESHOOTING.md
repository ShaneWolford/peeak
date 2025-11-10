# Nginx Troubleshooting Guide

## Quick Diagnosis

Run this command to diagnose all Nginx issues:

\`\`\`bash
bash scripts/fix-nginx.sh
\`\`\`

## Common Issues and Fixes

### 1. Nginx Not Running

\`\`\`bash
systemctl start nginx
systemctl enable nginx
systemctl status nginx
\`\`\`

### 2. App Not Running on Port 3000

\`\`\`bash
pm2 list
pm2 restart peeak
pm2 logs peeak
\`\`\`

### 3. Port 3000 Not Accessible

\`\`\`bash
# Check if app is running
curl http://localhost:3000

# If not, restart app
bash deploy.sh
\`\`\`

### 4. SSL Certificate Issues

\`\`\`bash
# Setup/renew SSL
bash scripts/setup-ssl.sh

# Check certificate
certbot certificates
\`\`\`

### 5. 502 Bad Gateway

This means Nginx can't reach your app on port 3000.

\`\`\`bash
# Check app status
pm2 list
pm2 logs peeak --lines 50

# Restart app
pm2 restart peeak

# If still failing, rebuild
bash deploy.sh
\`\`\`

### 6. Configuration Errors

\`\`\`bash
# Test config
nginx -t

# View errors
tail -f /var/log/nginx/error.log

# Fix config
bash scripts/fix-nginx.sh
\`\`\`

## Manual Nginx Configuration

If the script doesn't work, manually create the config:

\`\`\`bash
nano /etc/nginx/sites-available/peeak
\`\`\`

Paste the configuration from the fix-nginx.sh script, then:

\`\`\`bash
ln -sf /etc/nginx/sites-available/peeak /etc/nginx/sites-enabled/peeak
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
\`\`\`

## Checking Everything Works

\`\`\`bash
# Quick check
bash scripts/check-nginx.sh

# Manual checks
curl http://localhost:3000  # App should respond
curl http://app.peeak.org   # Should redirect to HTTPS
curl https://app.peeak.org  # Should load the site
\`\`\`

## Logs

\`\`\`bash
# Nginx error log
tail -f /var/log/nginx/error.log

# Nginx access log
tail -f /var/log/nginx/access.log

# App logs
pm2 logs peeak
