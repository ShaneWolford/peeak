#!/bin/bash

echo "🔧 Installing Node.js and dependencies..."

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 (process manager)
npm install -g pm2

# Verify installations
echo "✅ Node.js version:"
node --version

echo "✅ pnpm version:"
pnpm --version

echo "✅ PM2 version:"
pm2 --version

echo "✅ Installation complete!"
