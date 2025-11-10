# Environment Variables Setup Guide

This guide will help you properly configure your `.env` file for production deployment.

## Step 1: Create Your .env File

\`\`\`bash
cd /root/app/peeak
cp .env.example .env
nano .env
\`\`\`

## Step 2: Get Your Credentials

### Supabase Credentials

**Option A: From Vercel (Easiest)**
1. Go to vercel.com → Your Project → Settings → Environment Variables
2. Copy all SUPABASE_* variables

**Option B: From Supabase Dashboard**
1. Go to supabase.com → Your Project
2. Navigate to **Settings → API**
3. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`
4. Navigate to **Settings → Database**
5. Copy **Connection string** values:
   - Connection pooling → `SUPABASE_POSTGRES_PRISMA_URL`
   - Direct connection → `SUPABASE_POSTGRES_URL_NON_POOLING`

### Stripe Credentials (Optional)

1. Go to stripe.com → Dashboard → Developers → API keys
2. Copy:
   - **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → `STRIPE_SECRET_KEY`

### Blob Storage (Optional)

1. Go to vercel.com → Storage → Blob
2. Copy the **Read-Write Token** → `BLOB_READ_WRITE_TOKEN`

## Step 3: Format Your .env File

Your .env file should look like this (no quotes, no spaces around =):

\`\`\`env
# Supabase
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx

# Database
SUPABASE_POSTGRES_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
SUPABASE_POSTGRES_PRISMA_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
SUPABASE_POSTGRES_URL_NON_POOLING=postgresql://postgres.xxxxx:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# Stripe (Optional)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx

# Blob Storage (Optional)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://app.peeak.org
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://app.peeak.org/auth/callback
\`\`\`

## Step 4: Test Your Configuration

\`\`\`bash
# Make scripts executable
chmod +x scripts/test-env.sh
chmod +x deploy.sh

# Test that .env loads correctly
bash scripts/test-env.sh
\`\`\`

You should see ✅ for all required variables.

## Step 5: Deploy

\`\`\`bash
# Deploy the application
bash deploy.sh
\`\`\`

## Step 6: Verify in Container

After deployment, test that variables are available inside the container:

\`\`\`bash
# Make test script executable
chmod +x scripts/test-in-container.sh

# Run test
bash scripts/test-in-container.sh
\`\`\`

## Common Issues

### Issue: "NEXT_PUBLIC variables not found"

**Cause**: Environment variables not passed during build.

**Solution**: The docker-compose.yml must have `args` in the build section AND `env_file` for runtime.

### Issue: Variables show as "placeholder"

**Cause**: .env file has placeholder values or isn't being read.

**Solution**: 
\`\`\`bash
# Check .env content
cat .env | grep NEXT_PUBLIC

# Ensure no placeholder text remains
# Rebuild after fixing
docker compose down
docker compose build --no-cache
docker compose up -d
\`\`\`

### Issue: Container won't start

**Cause**: Build failed due to missing required variables.

**Solution**:
\`\`\`bash
# Check build logs
docker compose build 2>&1 | tee build.log
tail -50 build.log

# Fix .env, then rebuild
\`\`\`

## Important Rules

1. **No quotes** around values:
   - ✅ `KEY=value`
   - ❌ `KEY="value"`

2. **No spaces** around equals:
   - ✅ `KEY=value`
   - ❌ `KEY = value`

3. **NEXT_PUBLIC_*** variables are exposed to browser
   - These MUST be set at build time
   - Changes require rebuild: `docker compose build --no-cache`

4. **Server variables** are runtime only
   - These can be changed without rebuild
   - Just restart: `docker compose restart`

## Quick Commands

\`\`\`bash
# Test .env file
bash scripts/test-env.sh

# Deploy
bash deploy.sh

# Test in container
bash scripts/test-in-container.sh

# View logs
docker compose logs -f

# Restart (for runtime env changes)
docker compose restart

# Rebuild (for NEXT_PUBLIC_ changes)
docker compose down
docker compose build --no-cache
docker compose up -d
