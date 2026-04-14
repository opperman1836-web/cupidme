#!/bin/bash
set -e

echo "=== CupidMe Deployment ==="

cd /home/cupidme/cupidme

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm ci

echo "Building packages..."
npm run build

echo "Running database migrations..."
# npx supabase db push

echo "Restarting services..."
pm2 reload ecosystem.config.js --env production

echo "=== Deployment complete ==="
