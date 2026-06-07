#!/bin/bash
set -e

echo "Starting backend application..."
cd backend

# Run Prisma migrations
echo "Syncing database..."
npx prisma db push --skip-generate || echo "Database push skipped (already synced)"

# Start the application
echo "Starting NestJS application..."
node dist/main.js
