#!/bin/bash

# MySellGuid Teardown Script

echo "🛑 Stopping MySellGuid development environment..."

# Navigate to docker directory
cd "$(dirname "$0")/../docker"

# Stop and remove containers
docker-compose down

echo "✅ All containers stopped!"
echo ""
echo "To remove volumes (⚠️  this will delete all data):"
echo "docker-compose down -v"
