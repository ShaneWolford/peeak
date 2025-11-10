#!/bin/bash

echo "🔧 Fixing .env file format..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your actual values."
    exit 1
fi

# Show current first line
echo ""
echo "Current first line of .env:"
head -1 .env | cat -A

# Remove BOM (Byte Order Mark) if present
sed -i '1s/^\xEF\xBB\xBF//' .env

# Remove Windows line endings
sed -i 's/\r$//' .env

# Remove empty lines at the start
sed -i '/./,$!d' .env

# Check for lines without = sign
echo ""
echo "Checking for invalid lines (missing = sign)..."
grep -vE '^[A-Z_]+=' .env | grep -v '^#' | grep -v '^$' || echo "✅ All lines look valid"

# Show first 5 lines
echo ""
echo "First 5 lines of cleaned .env:"
head -5 .env

echo ""
echo "✅ .env file cleaned!"
echo ""
echo "Next steps:"
echo "1. Verify the values look correct: cat .env"
echo "2. If values are still 'your_value_here', update them with real credentials"
echo "3. Run: bash deploy.sh"
