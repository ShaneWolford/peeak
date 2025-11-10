#!/bin/bash

# Rollback Script for Peeak
# Reverts to previous Git commit

set -e

echo "⏮️  Rolling back Peeak application..."

# Check if there are commits to rollback to
if ! git log --oneline | head -2 | tail -1 > /dev/null 2>&1; then
    echo "❌ No previous commit to rollback to!"
    exit 1
fi

# Show current commit
echo "Current version:"
git log --oneline -1

# Show previous commit
echo ""
echo "Rolling back to:"
git log --oneline -2 | tail -1

# Confirm rollback
read -p "Continue with rollback? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled"
    exit 1
fi

# Rollback
git reset --hard HEAD~1

# Rebuild
echo "🔨 Rebuilding application..."
docker compose down
docker compose up -d --build

echo "✅ Rollback complete"
