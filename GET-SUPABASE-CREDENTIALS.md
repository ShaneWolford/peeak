# How to Get Supabase Credentials

## Quick Reference

### From Supabase Dashboard

1. **Go to Database Settings**
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database`
   - Scroll to "Connection string" section

2. **Connection Pooling URL** (for SUPABASE_POSTGRES_URL and SUPABASE_POSTGRES_PRISMA_URL)
   \`\`\`
   Select "URI" tab, toggle "Display connection pooling"
   Copy the full connection string
   \`\`\`

3. **Direct Connection URL** (for SUPABASE_POSTGRES_URL_NON_POOLING)
   \`\`\`
   Select "URI" tab, make sure "Display connection pooling" is OFF
   Copy the full connection string
   \`\`\`

4. **Individual Database Values**
   From the same page, you'll see:
   - Host: `aws-0-[region].pooler.supabase.com` (pooled) or `db.[project-ref].supabase.co` (direct)
   - Database name: `postgres`
   - Port: `6543` (pooled) or `5432` (direct)
   - User: `postgres.[project-ref]`
   - Password: Your database password

### From API Settings

1. **Go to API Settings**
   - URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api`

2. **Copy these values:**
   - **Project URL** → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

## Alternative: From Vercel

If you've connected Supabase to your Vercel project:

1. Go to `vercel.com` → Your Project → Settings → Environment Variables
2. All Supabase variables are already there
3. Copy each value to your VPS `.env` file

## Example .env Format

\`\`\`env
# Database URLs (from Database → Connection string)
SUPABASE_POSTGRES_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SUPABASE_POSTGRES_PRISMA_URL=postgresql://postgres.xxx:password@aws-0-region.pooler.supabase.com:6543/postgres
SUPABASE_POSTGRES_URL_NON_POOLING=postgresql://postgres.xxx:password@db.xxx.supabase.co:5432/postgres
SUPABASE_POSTGRES_HOST=aws-0-region.pooler.supabase.com
SUPABASE_POSTGRES_USER=postgres.xxx
SUPABASE_POSTGRES_PASSWORD=your_database_password
SUPABASE_POSTGRES_DATABASE=postgres

# API credentials (from Settings → API)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
SUPABASE_JWT_SECRET=your-jwt-secret

# Public variables (same as above, exposed to browser)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx...
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://app.peeak.org/auth/callback
\`\`\`

## Security Notes

- Never share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- Never commit `.env` to Git (it's in .gitignore)
- `NEXT_PUBLIC_*` variables are exposed to the browser, that's intentional
- Use connection pooling URLs for production (better performance)
