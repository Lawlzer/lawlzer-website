#!/bin/bash

echo "Starting Vercel build process..."

# Clear any existing node_modules issues
echo "Preparing build environment..."
rm -rf node_modules/.cache

# Install dependencies with legacy peer deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Force reinstall sharp with correct binaries
echo "Installing sharp with Linux binaries..."
npm uninstall sharp 2>/dev/null || true
npm install sharp --include=optional --os=linux --cpu=x64 --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Install native dependencies for Linux
echo "Installing native dependencies..."
npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --legacy-peer-deps --no-save

# Verify sharp installation
echo "Verifying sharp installation..."
node -e "try { require('sharp'); console.log('✓ Sharp module loaded successfully'); } catch(e) { console.error('✗ Sharp module failed to load:', e.message); process.exit(1); }"

# Build the application
echo "Building Next.js application..."
npm run build

echo "Build process completed!" 