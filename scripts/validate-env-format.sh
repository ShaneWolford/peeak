#!/bin/bash

echo "🔍 Validating .env file format..."
echo ""

if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    exit 1
fi

# Check for BOM
if head -c 3 .env | grep -q $'\xEF\xBB\xBF'; then
    echo "⚠️  WARNING: File has BOM (Byte Order Mark)"
    echo "   Run: bash scripts/fix-env.sh"
fi

# Check for Windows line endings
if grep -q $'\r' .env; then
    echo "⚠️  WARNING: File has Windows line endings (CRLF)"
    echo "   Run: bash scripts/fix-env.sh"
fi

# Check line 1
echo "Line 1 content:"
head -1 .env | cat -A
echo ""

# Check for required variables
echo "Checking required variables:"
required_vars=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "NEXT_PUBLIC_SITE_URL"
)

missing=0
for var in "${required_vars[@]}"; do
    if grep -q "^${var}=" .env; then
        value=$(grep "^${var}=" .env | cut -d'=' -f2)
        if [[ "$value" == *"your_value_here"* ]] || [[ "$value" == *"your-"* ]] || [ -z "$value" ]; then
            echo "⚠️  $var needs real value"
            missing=1
        else
            echo "✅ $var is set"
        fi
    else
        echo "❌ $var is missing"
        missing=1
    fi
done

echo ""
if [ $missing -eq 0 ]; then
    echo "✅ All required variables are set!"
    exit 0
else
    echo "❌ Some variables need attention"
    echo ""
    echo "Quick fix options:"
    echo "1. Copy from Vercel: vercel env pull .env.local (then copy values)"
    echo "2. Get from Supabase dashboard: Settings -> API"
    echo "3. Use template: bash scripts/create-env-template.sh"
    exit 1
fi
