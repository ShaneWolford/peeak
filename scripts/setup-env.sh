#!/bin/bash

# Script to help set up environment variables on VPS

echo "🔧 Peeak Environment Variable Setup"
echo "===================================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 1
    fi
    mv .env .env.backup
    echo "✅ Backed up existing .env to .env.backup"
fi

# Create .env from example
cp .env.example .env

echo ""
echo "📝 Now edit the .env file with your actual values:"
echo ""
echo "   nano .env"
echo ""
echo "You need to replace these placeholders:"
echo ""
echo "From Supabase Dashboard (supabase.com → Your Project → Settings):"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - Database URLs (found in Database settings)"
echo ""
echo "From Stripe Dashboard (dashboard.stripe.com → Developers → API keys):"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_PUBLISHABLE_KEY"
echo ""
echo "From Vercel Dashboard (vercel.com → Storage → Blob):"
echo "  - BLOB_READ_WRITE_TOKEN"
echo ""
echo "Update domain to: https://app.peeak.org"
echo ""
echo "After editing, restart the app:"
echo "   docker compose restart"
echo ""
