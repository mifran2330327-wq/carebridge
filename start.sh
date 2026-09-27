#!/bin/bash
# CareBridge - Docker Quick Start (Linux/macOS)

set -e

echo "============================================"
echo "CareBridge - Docker Quick Start"
echo "============================================"
echo

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker not found. Please install Docker Desktop first."
    echo "Download: https://www.docker.com/products/docker-desktop/"
    exit 1
fi

# Check docker-compose
if ! command -v docker-compose &> /dev/null; then
    echo "ERROR: docker-compose not found. It comes with Docker Desktop."
    exit 1
fi

echo "Docker found. Checking .env files..."

# Create .env files from examples if they don't exist
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please edit .env and add your Algolia keys."
    echo
fi

if [ ! -f "server/.env" ]; then
    echo "Creating server/.env from server/.env.example..."
    cp server/.env.example server/.env
    echo "Please edit server/.env and add your JWT_SECRET and Algolia keys."
    echo
fi

# Generate JWT secret if not set
if grep -q "your-super-secret-jwt-key-change-in-production-min-32-chars" server/.env 2>/dev/null; then
    echo "Generating secure JWT_SECRET..."
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/your-super-secret-jwt-key-change-in-production-min-32-chars/$JWT_SECRET/" server/.env
    echo "Generated JWT_SECRET in server/.env"
fi

echo
echo "Starting containers..."
echo "This will start: PostgreSQL (5432), Backend API (5000), Frontend (5173)"
echo

docker-compose up --build