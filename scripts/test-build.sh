#!/bin/bash

echo "Testing Next.js build locally..."

# Build the app to see any errors
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "Standalone output should be in .next/standalone"
    ls -la .next/standalone 2>/dev/null || echo "⚠️  Warning: .next/standalone not found"
else
    echo "❌ Build failed. Fix the errors above before deploying."
    exit 1
fi
