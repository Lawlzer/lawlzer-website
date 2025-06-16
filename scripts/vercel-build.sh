#!/bin/bash

echo "Starting Vercel build process..."

# Install dependencies with legacy peer deps
echo "Installing dependencies..."
npm install --legacy-peer-deps

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Install native dependencies for Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "Installing Linux native dependencies..."
    npm install lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --legacy-peer-deps --no-save || echo "Warning: Failed to install some native dependencies"
fi

# Build the application
echo "Building Next.js application..."
npm run build

echo "Build process completed!" 