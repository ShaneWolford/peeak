#!/bin/bash

# Set correct permissions for all scripts

echo "🔐 Setting up script permissions..."

# Make all scripts executable
chmod +x scripts/*.sh
chmod +x deploy.sh

echo "✅ Permissions set for:"
ls -lh scripts/*.sh
ls -lh deploy.sh

echo ""
echo "Scripts are now executable!"
