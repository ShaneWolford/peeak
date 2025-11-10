# Peeak VPS Troubleshooting Guide

Complete troubleshooting guide for common deployment issues.

---

## Permission Issues

### "peeak is not in the sudoers file"

**Cause:** User account doesn't have sudo privileges.

**Solution 1: Deploy as root (Recommended for simplicity)**

\`\`\`bash
# Log out of current user
exit

# Reconnect as root
ssh root@YOUR_VPS_IP

# Deploy from root account
cd /opt
git clone https://github.com/ShaneWolford/peeak.git
cd peeak
./deploy.sh
\`\`\`

**Solution 2: Add user to sudo group**

\`\`\`bash
# Switch to root user
su -
# Or reconnect as root
ssh root@YOUR_VPS_IP

# Add user to sudo group
usermod -aG sudo peeak

# Verify
groups peeak
# Should show: peeak : peeak sudo

# Switch back to user
su - peeak

# Test sudo access
sudo whoami
# Should output: root
\`\`\`

**Solution 3: Edit sudoers file directly (Advanced)**

\`\`\`bash
# As root, edit sudoers
visudo

# Add this line at the end:
peeak ALL=(ALL:ALL) ALL

# Save and exit: Ctrl+X, Y, Enter

# Switch to user and test
su - peeak
sudo whoami
\`\`\`

---

## Docker Issues

### Docker Command Not Found

\`\`\`bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group
sudo usermod -aG docker $USER

# Apply group changes
newgrp docker

# Verify
docker --version
\`\`\`

### Permission Denied Running Docker

\`\`\`bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Test
docker ps
\`\`\`

### Port 3000 Already in Use

\`\`\`bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 PID_NUMBER

# Or use different port in docker-compose.yml:
# ports:
#   - "3001:3000"
\`\`\`

### Docker Build Fails

\`\`\`bash
# Clear Docker cache
docker system prune -a -f

# Rebuild without cache
docker-compose build --no-cache

# Check disk space
df -h

# If low on space, clean up
docker system prune -a --volumes -f
\`\`\`

---

## Application Issues

### 502 Bad Gateway

**Cause:** Nginx can't reach the application.

\`\`\`bash
# Check if container is running
docker-compose ps

# Check logs for errors
docker-compose logs --tail=100

# Restart services
docker-compose restart
sudo systemctl restart nginx

# Test directly
curl http://localhost:3000
\`\`\`

### Application Won't Start

\`\`\`bash
# View detailed error logs
docker-compose logs -f

# Check environment variables
cat .env

# Verify all required variables are set
grep -E "^[A-Z]" .env | wc -l

# Rebuild application
docker-compose down
docker-compose up -d --build
\`\`\`

### White Screen / No Content

**Check browser console for errors:**
1. Open browser Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests

**Common causes:**
- Missing environment variables
- CORS issues
- Build errors

\`\`\`bash
# Rebuild with fresh environment
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Watch logs
docker-compose logs -f
\`\`\`

---

## Database Issues

### Database Connection Failed

\`\`\`bash
# Verify Supabase URL is accessible
curl https://YOUR_PROJECT.supabase.co

# Check environment variables
cat .env | grep SUPABASE

# Test from within container
docker exec -it peeak-app sh
env | grep SUPABASE
exit

# Restart with fresh env
docker-compose down
docker-compose up -d
\`\`\`

### RLS Policies Blocking Access

Check your Supabase Dashboard:
1. Go to Table Editor
2. Select table with issues
3. Check RLS policies
4. Ensure authenticated users have proper access

---

## Domain & SSL Issues

### Domain Not Resolving

\`\`\`bash
# Check DNS configuration
nslookup app.peeak.org

# Should return your VPS IP
# If not, wait longer (can take up to 48 hours)

# Check from different DNS server
nslookup app.peeak.org 8.8.8.8

# Flush DNS cache (on client machine)
# Windows: ipconfig /flushdns
# Mac: sudo dscacheutil -flushcache
\`\`\`

### SSL Certificate Fails to Install

\`\`\`bash
# Ensure DNS is properly configured first
nslookup app.peeak.org

# Check ports are open
sudo ufw status

# Open required ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Stop Nginx temporarily
sudo systemctl stop nginx

# Try standalone mode
sudo certbot certonly --standalone -d app.peeak.org

# Start Nginx
sudo systemctl start nginx

# Install certificate to Nginx
sudo certbot install --nginx -d app.peeak.org
\`\`\`

### SSL Certificate Expired

\`\`\`bash
# Certificates auto-renew, but if expired:
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx

# Check status
sudo certbot certificates
\`\`\`

---

## Resource Issues

### Out of Memory

\`\`\`bash
# Check memory usage
free -h

# Check what's using memory
ps aux --sort=-%mem | head

# Add swap space (2GB)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verify
free -h
\`\`\`

### Out of Disk Space

\`\`\`bash
# Check disk usage
df -h

# Find large files
du -h / | sort -rh | head -20

# Clean Docker
docker system prune -a --volumes -f

# Clean old logs
sudo journalctl --vacuum-time=7d

# Clean package cache
sudo apt clean
sudo apt autoremove -y
\`\`\`

---

## Network Issues

### Can't Connect to VPS

\`\`\`bash
# From local machine, test connection
ping YOUR_VPS_IP

# Test SSH port
telnet YOUR_VPS_IP 22

# Check firewall on VPS (if you can access)
sudo ufw status

# Ensure SSH is allowed
sudo ufw allow 22/tcp
\`\`\`

### Slow Application Performance

\`\`\`bash
# Check resource usage
docker stats

# Check network latency
ping -c 10 app.peeak.org

# Check Nginx logs for slow requests
sudo tail -f /var/log/nginx/access.log

# Optimize Nginx (add to config)
# client_body_buffer_size 10M;
# client_max_body_size 50M;
# gzip on;
\`\`\`

---

## Authentication Issues

### Login/Signup Not Working

**Check Supabase redirect URLs:**
1. Go to Supabase Dashboard
2. Authentication → URL Configuration
3. Ensure these are set:
   - Site URL: `https://app.peeak.org`
   - Redirect URLs: `https://app.peeak.org/**`

**Check environment variables:**
\`\`\`bash
# Verify site URL
grep NEXT_PUBLIC_SITE_URL .env

# Should be: https://app.peeak.org (with https, no trailing slash)

# Restart if changed
docker-compose restart
\`\`\`

### Email Confirmation Not Sending

Check Supabase Dashboard:
1. Authentication → Email Templates
2. Ensure templates are configured
3. Check SMTP settings (if using custom SMTP)
4. Test email delivery

---

## Debugging Commands

### Essential Diagnostics

\`\`\`bash
# Full system check
echo "=== System Info ==="
uname -a
df -h
free -h

echo "=== Docker Status ==="
docker --version
docker-compose ps

echo "=== Application Logs ==="
docker-compose logs --tail=50

echo "=== Nginx Status ==="
sudo systemctl status nginx
sudo nginx -t

echo "=== SSL Certificate ==="
sudo certbot certificates

echo "=== Firewall Status ==="
sudo ufw status

echo "=== DNS Check ==="
nslookup app.peeak.org

echo "=== Network Test ==="
curl -I http://localhost:3000
\`\`\`

### Save Diagnostic Report

\`\`\`bash
# Create diagnostic report
cat > /tmp/diagnostic.sh << 'EOF'
#!/bin/bash
echo "Peeak Diagnostic Report - $(date)"
echo "================================"
echo ""
echo "System Info:"
uname -a
echo ""
echo "Disk Space:"
df -h
echo ""
echo "Memory:"
free -h
echo ""
echo "Docker Containers:"
docker-compose ps
echo ""
echo "Application Logs (last 50 lines):"
docker-compose logs --tail=50
echo ""
echo "Nginx Config Test:"
sudo nginx -t
echo ""
echo "SSL Certificates:"
sudo certbot certificates
echo ""
echo "Environment Variables (sanitized):"
cat .env | grep -v "KEY\|SECRET\|PASSWORD" | grep "="
EOF

chmod +x /tmp/diagnostic.sh
/tmp/diagnostic.sh > /tmp/peeak-diagnostic-$(date +%Y%m%d-%H%M%S).txt

# View or share the report
cat /tmp/peeak-diagnostic-*.txt
\`\`\`

---

## Getting Help

If issues persist:

1. **Check logs first:** `docker-compose logs -f`
2. **Run diagnostics:** Use scripts above
3. **Review documentation:** README.md, VPS-DEPLOYMENT-GUIDE.md
4. **Search for error messages:** Google the specific error
5. **GitHub Issues:** Create issue with diagnostic report

---

**Common Error Messages:**

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| "permission denied" | User lacks sudo/docker access | Add to sudo/docker group |
| "502 Bad Gateway" | App not running or Nginx misconfigured | Check docker-compose ps, restart services |
| "ECONNREFUSED" | Database connection failed | Verify .env variables |
| "ERR_TOO_MANY_REDIRECTS" | SSL/domain misconfiguration | Check Nginx config, SSL setup |
| "Module not found" | Build error | Rebuild with --no-cache |
| "Port already in use" | Conflict with another service | Change port or stop conflicting service |

---
