#!/bin/bash

# Test Environment Variables Script
# This script checks if environment variables are properly loaded

echo "=== Environment Variables Test ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "✅ .env file exists"
echo ""

# Source the .env file
set -a
source .env
set +a

echo "📋 Checking NEXT_PUBLIC variables (these must be set for browser):"
echo ""

# Check NEXT_PUBLIC_SUPABASE_URL
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "✅ NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:0:30}..."
else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL: NOT SET"
fi

# Check NEXT_PUBLIC_SUPABASE_ANON_KEY
if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:0:30}..."
else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NOT SET"
fi

# Check NEXT_PUBLIC_SITE_URL
if [ -n "$NEXT_PUBLIC_SITE_URL" ]; then
    echo "✅ NEXT_PUBLIC_SITE_URL: $NEXT_PUBLIC_SITE_URL"
else
    echo "❌ NEXT_PUBLIC_SITE_URL: NOT SET"
fi

echo ""
echo "📋 Checking server-side variables:"
echo ""

# Check SUPABASE_URL
if [ -n "$SUPABASE_URL" ]; then
    echo "✅ SUPABASE_URL: ${SUPABASE_URL:0:30}..."
else
    echo "❌ SUPABASE_URL: NOT SET"
fi

# Check SUPABASE_SERVICE_ROLE_KEY
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY:0:30}..."
else
    echo "⚠️  SUPABASE_SERVICE_ROLE_KEY: NOT SET (optional)"
fi

# Check STRIPE_SECRET_KEY
if [ -n "$STRIPE_SECRET_KEY" ]; then
    echo "✅ STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY:0:30}..."
else
    echo "⚠️  STRIPE_SECRET_KEY: NOT SET (optional)"
fi

# Check BLOB_READ_WRITE_TOKEN
if [ -n "$BLOB_READ_WRITE_TOKEN" ]; then
    echo "✅ BLOB_READ_WRITE_TOKEN: ${BLOB_READ_WRITE_TOKEN:0:30}..."
else
    echo "⚠️  BLOB_READ_WRITE_TOKEN: NOT SET (optional)"
fi

echo ""
echo "=== Test Complete ==="
