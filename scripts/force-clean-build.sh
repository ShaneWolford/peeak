#!/bin/bash

echo "🧹 Force cleaning all build artifacts and caches..."

# Stop PM2
echo "Stopping PM2..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# Remove ALL cache and build directories
echo "Removing all caches..."
rm -rf .next
rm -rf .turbo
rm -rf node_modules/.cache
rm -rf .cache
rm -rf out
rm -rf build
rm -rf dist

# Remove node_modules completely
echo "Removing node_modules..."
rm -rf node_modules

# Remove package lock files
rm -rf package-lock.json
rm -rf pnpm-lock.yaml
rm -rf yarn.lock

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force 2>/dev/null || true

# Pull latest code
echo "Pulling latest code..."
git fetch origin
git reset --hard origin/main
git clean -fd

# Fresh install
echo "Fresh npm install..."
npm install

# Build with extra verbose logging
echo "Building application..."
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  
  # Start PM2
  echo "Starting PM2..."
  pm2 start npm --name "peeak-app" -- start
  pm2 save
  
  echo "✅ Deployment complete!"
  echo ""
  echo "Check logs with: pm2 logs peeak-app"
  echo "Check status with: pm2 status"
else
  echo "❌ Build failed. Check the error messages above."
  exit 1
fi
