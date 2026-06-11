#!/bin/bash
set -e

echo "Building backend..."
cd backend
npm install
echo "Generating Prisma client..."
npx prisma generate
echo "Building NestJS application..."
npm run build

echo "✅ Build complete! Application ready to start."
