#!/bin/bash

echo "📝 Creating .env file template..."

cat > .env << 'EOF'
# Node Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://app.peeak.org

# Supabase - Get these from supabase.com -> Your Project -> Settings -> API
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Supabase Database - Get these from supabase.com -> Your Project -> Settings -> Database
SUPABASE_POSTGRES_URL=postgresql://postgres.your-ref:password@aws-region.pooler.supabase.com:6543/postgres
SUPABASE_POSTGRES_PRISMA_URL=postgresql://postgres.your-ref:password@aws-region.pooler.supabase.com:6543/postgres
SUPABASE_POSTGRES_URL_NON_POOLING=postgresql://postgres.your-ref:password@db.your-ref.supabase.co:5432/postgres
SUPABASE_POSTGRES_HOST=aws-region.pooler.supabase.com
SUPABASE_POSTGRES_USER=postgres.your-ref
SUPABASE_POSTGRES_PASSWORD=your-password-here
SUPABASE_POSTGRES_DATABASE=postgres

# Stripe - Get these from stripe.com -> Dashboard -> Developers -> API keys
STRIPE_SECRET_KEY=sk_test_your-key-here
STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-key-here
STRIPE_MCP_KEY=your-mcp-key-here

# Vercel Blob - Get from vercel.com -> Storage -> Blob
BLOB_READ_WRITE_TOKEN=your-blob-token-here

# Grok AI (Optional)
GROK_XAI_API_KEY=your-grok-key-here

# Auth Redirect
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://app.peeak.org/auth/callback
EOF

echo "✅ Created .env template"
echo ""
echo "⚠️  IMPORTANT: Edit .env and replace placeholder values with real credentials"
echo ""
echo "To edit: nano .env"
