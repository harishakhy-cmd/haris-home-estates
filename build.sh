#!/bin/bash
set -e

echo "Building backend..."
cd backend
npm install
echo "Generating Prisma client..."
npx prisma generate
echo "Pushing Prisma schema to database..."
npx prisma db push --skip-generate 2>/dev/null || echo "⚠️  Database push may have skipped (could be first deployment)"
echo "Building NestJS application..."
npm run build

echo "✅ Build complete! Application ready to start."
