# Peeak Social Media Platform - Deployment Overview

This directory contains all files needed to deploy Peeak on a VPS server.

## 📁 File Structure

\`\`\`
peeak/
├── Dockerfile                    # Docker image configuration
├── docker-compose.yml            # Docker Compose orchestration
├── .env.example                  # Environment variables template
├── .dockerignore                 # Files to exclude from Docker build
├── next.config.mjs               # Next.js configuration
├── VPS-DEPLOYMENT-GUIDE.md       # Complete deployment guide
├── QUICK-START.md                # Quick deployment reference
├── scripts/
│   ├── health-check.sh           # Application health monitoring
│   ├── update.sh                 # Update deployment script
│   ├── backup.sh                 # Backup script
│   └── rollback.sh               # Rollback to previous version
├── app/                          # Next.js application
├── components/                   # React components
└── public/                       # Static assets
\`\`\`

## 🚀 Deployment Options

### Option 1: VPS Deployment (Full Control)

Deploy on your own VPS server with Docker.

**Pros:**
- Full control over infrastructure
- No vendor lock-in
- Cost-effective for high traffic
- Can use any domain

**Follow:** [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)

### Option 2: Quick VPS Deploy (Fast)

For experienced developers who want to deploy quickly.

**Follow:** [QUICK-START.md](QUICK-START.md)

### Option 3: Vercel (Easiest)

Deploy directly to Vercel (recommended for testing).

**Steps:**
1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables
4. Deploy

**Note:** Vercel doesn't support Docker, but Next.js works natively.

## 🔧 Required Services

### 1. Supabase (Database & Auth)
- Create project at [supabase.com](https://supabase.com)
- Run SQL scripts in `scripts/` folder
- Get API keys from Settings

### 2. Vercel Blob (Media Storage)
- Create account at [vercel.com](https://vercel.com)
- Create Blob store
- Get read/write token

### 3. Stripe (Payments) - Optional
- Create account at [stripe.com](https://stripe.com)
- Get API keys from Developers section

## 📝 Environment Variables Required

\`\`\`env
# Supabase (Required)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database (Required)
SUPABASE_POSTGRES_URL=
SUPABASE_POSTGRES_PRISMA_URL=
SUPABASE_POSTGRES_URL_NON_POOLING=

# Blob Storage (Required)
BLOB_READ_WRITE_TOKEN=

# Site Config (Required)
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://yourdomain.com

# Stripe (Optional)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
\`\`\`

## 🏗️ Architecture

\`\`\`
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│    Nginx    │ ← SSL/TLS Termination
│  (Port 80)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Docker    │
│  Container  │ ← Next.js App (Port 3000)
└──────┬──────┘
       │
       ├──────→ Supabase (Database & Auth)
       ├──────→ Vercel Blob (Media Storage)
       └──────→ Stripe (Payments)
\`\`\`

## 🛠️ Maintenance Scripts

### Health Check
\`\`\`bash
./scripts/health-check.sh
\`\`\`
Checks if application is running and responding.

### Update Application
\`\`\`bash
./scripts/update.sh
\`\`\`
Pulls latest code and redeploys automatically.

### Backup
\`\`\`bash
./scripts/backup.sh
\`\`\`
Creates backup of configuration and logs.

### Rollback
\`\`\`bash
./scripts/rollback.sh
\`\`\`
Reverts to previous version if update fails.

## 🔒 Security Checklist

- [ ] Use strong passwords for VPS root user
- [ ] Configure UFW firewall (only ports 22, 80, 443)
- [ ] Keep `.env` file secure (never commit to Git)
- [ ] Use SSL certificate (Let's Encrypt)
- [ ] Enable automatic security updates
- [ ] Use non-root Docker user (already configured)
- [ ] Regular backups of database
- [ ] Monitor logs for suspicious activity

## 📊 Monitoring

### View Application Logs
\`\`\`bash
docker-compose logs -f
\`\`\`

### View Nginx Logs
\`\`\`bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
\`\`\`

### Check Resource Usage
\`\`\`bash
docker stats peeak-app
\`\`\`

### System Resources
\`\`\`bash
htop
df -h
free -h
\`\`\`

## 🆘 Common Issues

### Application Won't Start
\`\`\`bash
# Check logs
docker-compose logs

# Verify environment variables
cat .env

# Rebuild
docker-compose down
docker-compose up -d --build
\`\`\`

### 502 Bad Gateway
\`\`\`bash
# Restart services
docker-compose restart
sudo systemctl restart nginx
\`\`\`

### Database Connection Failed
- Verify Supabase credentials in `.env`
- Check database is online at supabase.com
- Test connection string manually

### Domain Not Resolving
- Check DNS settings at your registrar
- Wait 5-10 minutes for DNS propagation
- Use `nslookup your-domain.com` to verify

## 📱 Mobile Testing

After deployment, test on:
- iOS Safari (iPhone)
- Android Chrome
- Various screen sizes

## 🚦 Pre-Launch Checklist

- [ ] All environment variables configured
- [ ] Database tables created and seeded
- [ ] SSL certificate installed (HTTPS working)
- [ ] Domain pointing to VPS correctly
- [ ] Sign up/login flow tested
- [ ] Media upload tested
- [ ] Real-time features tested (messaging, notifications)
- [ ] Mobile responsiveness checked
- [ ] Performance tested (Lighthouse score)
- [ ] Error monitoring configured
- [ ] Backup strategy in place

## 📞 Support Resources

- **Next.js Docs:** https://nextjs.org/docs
- **Supabase Docs:** https://supabase.com/docs
- **Docker Docs:** https://docs.docker.com
- **Nginx Docs:** https://nginx.org/en/docs
- **Let's Encrypt:** https://letsencrypt.org

## 📄 License

See [LICENSE](LICENSE) file for details.

---

**Ready to deploy?** Start with [QUICK-START.md](QUICK-START.md) or [VPS-DEPLOYMENT-GUIDE.md](VPS-DEPLOYMENT-GUIDE.md)
