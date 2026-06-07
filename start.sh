#!/bin/bash
set -e

echo "Starting backend application..."
cd backend

echo "NestJS application starting on port 3000..."
exec node dist/main.js
