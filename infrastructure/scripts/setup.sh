#!/bin/bash

# MySellGuid Setup Script

echo "🚀 Setting up MySellGuid development environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Start Docker containers
echo "📦 Starting Docker containers (PostgreSQL + Redis)..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker exec mysellguid-postgres pg_isready -U postgres > /dev/null 2>&1; do
    sleep 1
done

echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
until docker exec mysellguid-redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
done

echo "✅ Redis is ready!"

# Navigate to backend directory
cd ../../backend

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your API keys!"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your API keys (OpenAI, Apify, Firebase, AWS)"
echo "2. Run 'npm run start:dev' in the backend directory"
echo ""
echo "Services:"
echo "- PostgreSQL: localhost:5432 (user: postgres, password: postgres)"
echo "- Redis: localhost:6379"
echo "- pgAdmin: http://localhost:5050 (email: admin@mysellguid.com, password: admin)"
