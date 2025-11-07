#!/bin/bash

# MySellGuid Setup Script
# This script checks prerequisites and helps you set up the project

set -e

echo "=================================================="
echo "  MySellGuid - Setup Script"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "Step 1: Checking Prerequisites"
echo "================================"
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js is installed (${NODE_VERSION})"
    if [[ "${NODE_VERSION}" < "v18" ]]; then
        print_warning "Node.js 18+ is recommended. You have ${NODE_VERSION}"
    fi
else
    print_status 1 "Node.js is NOT installed"
    echo "  Install: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm is installed (${NPM_VERSION})"
else
    print_status 1 "npm is NOT installed"
    exit 1
fi

# Check PostgreSQL
if command_exists psql; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    print_status 0 "PostgreSQL client is installed (${PSQL_VERSION})"

    # Check if PostgreSQL server is running
    if pg_isready -q 2>/dev/null; then
        print_status 0 "PostgreSQL server is running"
        PG_RUNNING=true
    else
        print_warning "PostgreSQL server is NOT running"
        print_info "Start with: service postgresql start"
        PG_RUNNING=false
    fi
else
    print_warning "PostgreSQL is NOT installed (optional if using cloud database)"
    print_info "Install: apt-get install postgresql postgresql-contrib postgis"
    print_info "Or use cloud database: https://supabase.com or https://neon.tech"
    PG_RUNNING=false
fi

# Check Redis
if command_exists redis-cli; then
    print_status 0 "Redis client is installed"

    # Check if Redis server is running
    if redis-cli ping >/dev/null 2>&1; then
        print_status 0 "Redis server is running"
        REDIS_RUNNING=true
    else
        print_warning "Redis server is NOT running"
        print_info "Start with: redis-server --daemonize yes"
        REDIS_RUNNING=false
    fi
else
    print_warning "Redis is NOT installed (optional if using cloud Redis)"
    print_info "Install: apt-get install redis-server"
    print_info "Or use cloud Redis: https://upstash.com or https://redis.com/try-free"
    REDIS_RUNNING=false
fi

echo ""
echo "Step 2: Installing Dependencies"
echo "================================"
echo ""

# Install backend dependencies
if [ ! -d "backend/node_modules" ]; then
    print_info "Installing backend dependencies..."
    cd backend && npm install && cd ..
    print_status 0 "Backend dependencies installed"
else
    print_status 0 "Backend dependencies already installed"
fi

# Install mobile dependencies
if [ ! -d "mobile/node_modules" ]; then
    print_info "Installing mobile dependencies..."
    cd mobile && npm install && cd ..
    print_status 0 "Mobile dependencies installed"
else
    print_status 0 "Mobile dependencies already installed"
fi

echo ""
echo "Step 3: Configuration"
echo "================================"
echo ""

# Check .env file
if [ -f "backend/.env" ]; then
    print_status 0 "Backend .env file exists"
else
    print_warning "Backend .env file does NOT exist"
    print_info "Creating .env from .env.example..."
    cp backend/.env.example backend/.env
    print_status 0 "Created backend/.env"
    print_warning "Please update backend/.env with your database credentials"
fi

echo ""
echo "Step 4: Database Setup"
echo "================================"
echo ""

if [ "$PG_RUNNING" = true ]; then
    # Check if database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw mysellguid 2>/dev/null; then
        print_status 0 "Database 'mysellguid' exists"
    else
        print_warning "Database 'mysellguid' does NOT exist"
        read -p "Create database now? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            createdb -U postgres mysellguid 2>/dev/null || psql -U postgres -c "CREATE DATABASE mysellguid;"
            print_status 0 "Database created"

            # Enable PostGIS
            psql -U postgres mysellguid -c "CREATE EXTENSION IF NOT EXISTS postgis;" >/dev/null 2>&1
            print_status 0 "PostGIS extension enabled"
        fi
    fi
else
    print_warning "PostgreSQL is not running. Skipping database setup."
    print_info "You can use a cloud database instead (see backend/.env)"
fi

echo ""
echo "Step 5: Build Backend"
echo "================================"
echo ""

print_info "Building backend..."
cd backend && npm run build
if [ $? -eq 0 ]; then
    print_status 0 "Backend built successfully"
else
    print_status 1 "Backend build failed"
    exit 1
fi
cd ..

echo ""
echo "=================================================="
echo "  Setup Complete!"
echo "=================================================="
echo ""

# Print next steps
echo "Next Steps:"
echo ""

if [ "$PG_RUNNING" = false ]; then
    echo "1. ${YELLOW}Start PostgreSQL:${NC}"
    echo "   service postgresql start"
    echo "   OR use a cloud database (update backend/.env)"
    echo ""
fi

if [ "$REDIS_RUNNING" = false ]; then
    echo "2. ${YELLOW}Start Redis:${NC}"
    echo "   redis-server --daemonize yes"
    echo "   OR use a cloud Redis (update backend/.env)"
    echo ""
fi

echo "3. ${GREEN}Start the backend:${NC}"
echo "   cd backend && npm run start:dev"
echo ""

echo "4. ${GREEN}Seed the database with test data:${NC}"
echo "   curl -X POST http://localhost:3000/api/seed"
echo ""

echo "5. ${GREEN}Test the API:${NC}"
echo "   curl http://localhost:3000/api/health"
echo "   Open: http://localhost:3000/api/docs"
echo ""

echo "6. ${GREEN}Start the mobile app:${NC}"
echo "   cd mobile && npm start"
echo ""

echo "=================================================="
echo "For more information, see:"
echo "  - README.md - Full documentation"
echo "  - QUICK_START.md - Quick start guide"
echo "  - PROJECT_STATUS.md - Detailed project status"
echo "=================================================="
