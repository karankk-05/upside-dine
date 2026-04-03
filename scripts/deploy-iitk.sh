#!/bin/bash
# =====================================================
# UpsideDine — IITK Server Deployment Script
# Run this on the IITK server (csehn6.cse.iitk.ac.in)
# =====================================================

set -e

echo "🚀 UpsideDine IITK Server Deployment"
echo "======================================"

# 1. Check if docker and docker compose are available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Ask admin (saurabh@cse.iitk.ac.in) to install it."
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# 2. Clone or pull the repo
REPO_DIR="$HOME/upside_dine"
if [ -d "$REPO_DIR" ]; then
    echo "📦 Pulling latest changes..."
    cd "$REPO_DIR"
    git pull origin deployment_v2
else
    echo "📦 Cloning repository..."
    git clone -b deployment_v2 https://github.com/karankk-05/upside-dine.git "$REPO_DIR"
    cd "$REPO_DIR"
fi

# 3. Check .env.prod.iitk exists
if [ ! -f .env.prod.iitk ]; then
    echo "❌ .env.prod.iitk not found! Copy it to the project root."
    exit 1
fi

echo "✅ Environment file found"

# 4. Build and start services
echo "🔨 Building containers..."
docker compose -f docker-compose.prod.iitk.yml build

echo "🚀 Starting services..."
docker compose -f docker-compose.prod.iitk.yml up -d

echo ""
echo "======================================"
echo "✅ Deployment complete!"
echo ""
echo "Services running:"
docker compose -f docker-compose.prod.iitk.yml ps
echo ""
echo "📋 Nginx LB:   http://172.27.16.252"
echo "📋 Channels:   ws://172.27.16.252/ws/"
echo "📋 ML Service: http://172.27.16.252/ml/"
echo ""
echo "🔍 Check logs:  docker compose -f docker-compose.prod.iitk.yml logs -f"
echo "🔄 Redeploy:    docker compose -f docker-compose.prod.iitk.yml up -d --build"
echo "🛑 Stop:        docker compose -f docker-compose.prod.iitk.yml down"
