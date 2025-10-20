#!/bin/bash

# Oliver-OS Production Deployment Script
# For the honor, not the glory—by the people, for the people.

set -e

echo "🚀 Starting Oliver-OS Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found. Creating from example..."
    cp env.production.example .env.production
    print_warning "Please edit .env.production with your production values before continuing."
    exit 1
fi

# Check if required environment variables are set
print_status "Checking environment configuration..."
source .env.production

if [ "$JWT_SECRET" = "CHANGE_ME_TO_VERY_LONG_RANDOM_STRING_AT_LEAST_32_CHARS" ]; then
    print_error "JWT_SECRET is not set. Please update .env.production"
    exit 1
fi

if [ "$POSTGRES_PASSWORD" = "CHANGE_ME_STRONG_PASSWORD" ]; then
    print_error "POSTGRES_PASSWORD is not set. Please update .env.production"
    exit 1
fi

print_status "Environment configuration looks good!"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker/docker-compose.prod.yml down

# Build and start services
print_status "Building and starting services..."
docker-compose -f docker/docker-compose.prod.yml up --build -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check if services are running
print_status "Checking service health..."

# Check Oliver-OS backend
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "✅ Oliver-OS backend is healthy"
else
    print_error "❌ Oliver-OS backend is not responding"
    docker-compose -f docker/docker-compose.prod.yml logs oliver-os
    exit 1
fi

# Check AI services
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "✅ AI services are healthy"
else
    print_warning "⚠️ AI services are not responding (this might be expected if not configured)"
fi

# Run database migrations
print_status "Running database migrations..."
docker-compose -f docker/docker-compose.prod.yml exec oliver-os npx prisma db push

# Seed database if needed
print_status "Seeding database..."
docker-compose -f docker/docker-compose.prod.yml exec oliver-os npx prisma db seed

print_status "🎉 Deployment completed successfully!"
print_status "Oliver-OS is now running at:"
print_status "  - Backend API: http://localhost:3000"
print_status "  - AI Services: http://localhost:8000"
print_status "  - Grafana Dashboard: http://localhost:3001"
print_status "  - Prometheus: http://localhost:9090"

print_status "Available endpoints:"
print_status "  - Health: http://localhost:3000/health"
print_status "  - API: http://localhost:3000/api/"
print_status "  - Auth: http://localhost:3000/api/auth/"

print_status "To view logs: docker-compose -f docker/docker-compose.prod.yml logs -f"
print_status "To stop: docker-compose -f docker/docker-compose.prod.yml down"

echo ""
echo "For the honor, not the glory—by the people, for the people. 🚀"
