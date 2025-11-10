#!/bin/bash

echo "==================================="
echo "Supabase Environment Setup Helper"
echo "==================================="
echo ""
echo "Go to your Supabase Dashboard:"
echo "https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database"
echo ""
echo "You'll need:"
echo ""
echo "1. DATABASE SETTINGS (Settings → Database → Connection String)"
echo "   - Copy 'Connection Pooling' URL"
echo "   - Copy 'Direct Connection' URL"
echo ""
echo "2. API SETTINGS (Settings → API)"
echo "   - Project URL"
echo "   - anon public key"
echo "   - service_role key"
echo "   - JWT Secret"
echo ""
echo "Enter values below (press Enter to skip):"
echo ""

# Read Project URL
read -p "Project URL (https://xxx.supabase.co): " PROJECT_URL
read -p "Anon Public Key: " ANON_KEY
read -p "Service Role Key: " SERVICE_KEY
read -p "JWT Secret: " JWT_SECRET
read -p "Connection Pooling URL: " POOLING_URL
read -p "Direct Connection URL: " DIRECT_URL

# Extract parts from connection string
if [ ! -z "$POOLING_URL" ]; then
    # Extract host, user, password, database from URL
    POSTGRES_HOST=$(echo $POOLING_URL | sed -n 's/.*@$$.*$$:[0-9]*.*/\1/p')
    POSTGRES_USER=$(echo $POOLING_URL | sed -n 's/.*:\/\/$$[^:]*$$:.*/\1/p')
    POSTGRES_PASSWORD=$(echo $POOLING_URL | sed -n 's/.*:\/\/[^:]*:$$[^@]*$$@.*/\1/p')
    POSTGRES_DATABASE=$(echo $POOLING_URL | sed -n 's/.*\/$$[^?]*$$.*/\1/p')
fi

# Create .env file
cat > .env << EOF
# Node Environment
NODE_ENV=production

# Supabase Database URLs
SUPABASE_POSTGRES_URL=${POOLING_URL}
SUPABASE_POSTGRES_PRISMA_URL=${POOLING_URL}
SUPABASE_POSTGRES_URL_NON_POOLING=${DIRECT_URL}
SUPABASE_POSTGRES_HOST=${POSTGRES_HOST}
SUPABASE_POSTGRES_USER=${POSTGRES_USER}
SUPABASE_POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
SUPABASE_POSTGRES_DATABASE=${POSTGRES_DATABASE:-postgres}

# Supabase Auth & API
SUPABASE_URL=${PROJECT_URL}
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
SUPABASE_JWT_SECRET=${JWT_SECRET}

# Supabase Public (browser accessible)
NEXT_PUBLIC_SUPABASE_URL=${PROJECT_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://app.peeak.org/auth/callback

# Stripe Payment Keys (add your Stripe keys here)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_MCP_KEY=your_stripe_mcp_key

# Grok AI (optional)
GROK_XAI_API_KEY=your_grok_key

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=your_blob_token

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://app.peeak.org

# Disable Telemetry
NEXT_TELEMETRY_DISABLED=1
EOF

echo ""
echo "✓ Created .env file!"
echo ""
echo "Next steps:"
echo "1. Add your Stripe keys to .env (if using payments)"
echo "2. Add your Blob token to .env (if using image uploads)"
echo "3. Run: docker compose down && docker compose build --no-cache && docker compose up -d"
echo ""
