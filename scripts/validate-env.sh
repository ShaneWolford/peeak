#!/bin/bash

# Script to validate environment variables

echo "🔍 Validating Environment Variables"
echo "===================================="
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Run: bash scripts/setup-env.sh"
    exit 1
fi

# Source the .env file
set -a
source .env
set +a

# Required variables
REQUIRED_VARS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_SITE_URL"
    "BLOB_READ_WRITE_TOKEN"
)

MISSING_VARS=()

# Check each required variable
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    elif [[ "${!var}" == *"your"* ]] || [[ "${!var}" == *"placeholder"* ]]; then
        MISSING_VARS+=("$var (still has placeholder value)")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ All required environment variables are set!"
    echo ""
    echo "Current configuration:"
    echo "  Site URL: $NEXT_PUBLIC_SITE_URL"
    echo "  Supabase: ${SUPABASE_URL}"
    echo ""
else
    echo "❌ Missing or invalid environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "Please edit .env and add these values:"
    echo "  nano .env"
    exit 1
fi

# Check if site URL matches production domain
if [[ ! "$NEXT_PUBLIC_SITE_URL" == *"app.peeak.org"* ]]; then
    echo "⚠️  Warning: NEXT_PUBLIC_SITE_URL is not set to production domain"
    echo "   Current: $NEXT_PUBLIC_SITE_URL"
    echo "   Expected: https://app.peeak.org"
    echo ""
fi

echo "Environment validation complete!"
