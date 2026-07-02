#!/bin/sh
set -e

# Run database migrations
echo "Running database migrations..."
prisma migrate deploy

# Start the application
echo "Starting Listio..."
exec node server.js
