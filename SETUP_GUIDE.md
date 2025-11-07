# MySellGuid - Complete Setup Guide

## 🎯 Overview

This guide will help you get MySellGuid running on your machine. The project consists of:
- **Backend** - NestJS API with PostgreSQL + PostGIS + Redis
- **Mobile App** - React Native with Expo
- **Database** - PostgreSQL 15+ with PostGIS extension
- **Cache/Queue** - Redis for caching and background jobs

---

## 📋 Prerequisites

### Required
- **Node.js 18+** and npm 9+ - [Download](https://nodejs.org/)
- **PostgreSQL 15+** with PostGIS - [Installation](#postgresql-setup)
- **Redis 7+** - [Installation](#redis-setup)

### Optional (can use cloud alternatives)
- Docker & Docker Compose
- AWS Account (for S3 image storage)
- OpenAI API Key (for AI features)
- Firebase Account (for push notifications)

---

## 🚀 Quick Start (Automated)

Run the setup script to check prerequisites and set up the project:

```bash
./setup.sh
```

This script will:
1. Check all prerequisites
2. Install dependencies
3. Create `.env` configuration
4. Set up the database
5. Build the backend

---

## 📖 Manual Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd mysellguid

# Install all dependencies
npm install
```

### Step 2: Database Setup

#### Option A: Local PostgreSQL

```bash
# Install PostgreSQL with PostGIS
sudo apt-get install postgresql postgresql-contrib postgis

# Start PostgreSQL
sudo service postgresql start

# Create database
sudo -u postgres createdb mysellguid

# Enable PostGIS extension
sudo -u postgres psql mysellguid -c "CREATE EXTENSION postgis;"
```

#### Option B: Cloud PostgreSQL (Recommended)

Use a cloud provider that supports PostGIS:

**Supabase** (Recommended):
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy connection details
4. Update `backend/.env` with connection string

**Neon**:
1. Go to [neon.tech](https://neon.tech)
2. Create a new project with PostGIS
3. Copy connection details
4. Update `backend/.env`

### Step 3: Redis Setup

#### Option A: Local Redis

```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
redis-server --daemonize yes

# Test Redis
redis-cli ping
# Should return: PONG
```

#### Option B: Cloud Redis (Recommended)

**Upstash**:
1. Go to [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy connection details
4. Update `backend/.env`

### Step 4: Configure Environment

```bash
# Create .env file from example
cp backend/.env.example backend/.env

# Edit the file
nano backend/.env
```

**Minimal configuration** (for local development):
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=mysellguid

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=your-dev-secret-here
JWT_REFRESH_SECRET=your-dev-refresh-secret-here
```

**Cloud configuration**:
```env
# Supabase example
DATABASE_HOST=db.your-project.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=postgres

# Upstash Redis example
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Step 5: Build and Start Backend

```bash
cd backend

# Build the project
npm run build

# Start in development mode
npm run start:dev
```

The backend will be available at:
- API: http://localhost:3000/api
- Swagger Docs: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/health

### Step 6: Seed Database with Test Data

```bash
# In a new terminal
curl -X POST http://localhost:3000/api/seed
```

This creates:
- 2 test users
- 5 stores in Tel Aviv
- 10 sales with discounts

**Test credentials:**
- User: `test@mysellguid.com` / `password123`
- Store Owner: `store@mysellguid.com` / `password123`

### Step 7: Test the API

```bash
# Check health
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@mysellguid.com", "password": "password123"}'

# Find nearby sales (Tel Aviv, 5km radius)
curl "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000"
```

### Step 8: Start Mobile App

```bash
cd mobile

# Start Expo dev server
npm start
```

Then:
1. Install **Expo Go** app on your phone
2. Scan the QR code
3. The app will load on your device

---

## 🔧 What Was Fixed

During setup, the following issues were identified and fixed:

### ✅ Fixed Issues

1. **Password Exposure** - Added `ClassSerializerInterceptor` to prevent password hashes from being returned in API responses
2. **Geospatial Store/Sale Creation** - Fixed store and sale creation methods to properly handle PostGIS geography type using raw SQL
3. **Configuration** - Improved `.env` file with clear documentation and cloud database options
4. **Health Checks** - Added health check endpoints for database and Redis monitoring
5. **Build Errors** - Fixed TypeScript errors related to store entity field names

### 📊 Current Status

**Working:**
- ✅ Backend compiles and builds successfully
- ✅ All dependencies installed
- ✅ Configuration templates ready
- ✅ Database schema defined
- ✅ Mobile app structure complete
- ✅ API documentation (Swagger)
- ✅ Health check endpoints

**Blocked (needs database setup):**
- ⚠️ Backend cannot start without PostgreSQL + PostGIS
- ⚠️ Backend cannot start without Redis
- ⚠️ Database schema not created (will auto-create on first run)
- ⚠️ No test data (run seed endpoint after backend starts)

---

## 🧪 Testing

### Test API Endpoints

```bash
# Health check
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/database

# Redis health
curl http://localhost:3000/api/health/redis
```

### Test Geospatial Search

```bash
# Get sales near Tel Aviv city center
curl "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000"

# Get stores near Rothschild Boulevard
curl "http://localhost:3000/api/stores/nearby?lat=32.0667&lng=34.7746&radius=2000"
```

### Run Automated Tests

```bash
cd backend
npm run test
```

---

## 🐳 Docker Alternative (Recommended)

If you have Docker installed, use Docker Compose for database setup:

```bash
cd infrastructure/docker
docker-compose up -d postgres redis

# Wait for services to start
sleep 10

# Check containers are running
docker ps
```

Then configure `backend/.env` to use:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=mysellguid

REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## 🔍 Troubleshooting

### Backend won't start

**Error:** `Connection refused - localhost:5432`
- **Solution:** PostgreSQL is not running. Start it with `service postgresql start` or use a cloud database.

**Error:** `ECONNREFUSED - Redis connection failed`
- **Solution:** Redis is not running. Start it with `redis-server --daemonize yes` or use a cloud Redis.

**Error:** `PostGIS extension not found`
- **Solution:** Install PostGIS: `apt-get install postgis`
- Or use Supabase/Neon which include PostGIS by default.

### Database schema errors

**Error:** `relation "users" does not exist`
- **Solution:** The database schema hasn't been created yet. The backend will auto-create tables on first start when `synchronize: true` is set in development mode.

### Mobile app won't connect to API

**Error:** `Network request failed`
- **Solution:** Update `mobile/app.json` with your backend URL:
  ```json
  {
    "extra": {
      "apiUrl": "http://YOUR-IP:3000/api"
    }
  }
  ```
  Replace `YOUR-IP` with your computer's local IP address (not localhost).

---

## 📱 Mobile App Setup

### Configure API URL

Edit `mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.100:3000/api"
    }
  }
}
```

Replace `192.168.1.100` with your actual IP address.

### Run on Physical Device

1. Install **Expo Go** from App Store (iOS) or Play Store (Android)
2. Make sure your phone is on the same network as your computer
3. Run `npm start` in the `mobile` directory
4. Scan the QR code with Expo Go

### Run on Emulator

**iOS:**
```bash
npm run ios
```

**Android:**
```bash
npm run android
```

---

## 📚 Next Steps

### Essential Features to Add

1. **Firebase Push Notifications**
   - See `FIREBASE_SETUP.md` for detailed setup
   - Get free Firebase account at [firebase.google.com](https://firebase.google.com)

2. **Image Upload**
   - Set up AWS S3 bucket
   - Or use Cloudflare R2 (S3-compatible)
   - Update AWS credentials in `.env`

3. **AI Features** (Optional)
   - Get OpenAI API key at [platform.openai.com](https://platform.openai.com)
   - Add to `.env` as `OPENAI_API_KEY`

4. **Social Media Scraping** (Optional)
   - Get Apify API token at [apify.com](https://apify.com)
   - Add to `.env` as `APIFY_API_TOKEN`

### Production Deployment

See `DEPLOYMENT_SUMMARY.md` for:
- AWS deployment guide
- Production configuration
- Security best practices
- Monitoring setup

---

## 📞 Support & Resources

### Documentation
- **README.md** - Project overview
- **QUICK_START.md** - Quick start guide
- **PROJECT_STATUS.md** - Detailed project status and roadmap
- **FIREBASE_SETUP.md** - Firebase configuration guide
- **DEPLOYMENT_SUMMARY.md** - Production deployment guide

### API Documentation
- Swagger UI: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/api/health

### Useful Commands

```bash
# Backend
cd backend
npm run start:dev      # Start development server
npm run build          # Build for production
npm run test           # Run tests

# Mobile
cd mobile
npm start              # Start Expo dev server
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator

# Database
./setup.sh             # Run setup script
curl -X POST http://localhost:3000/api/seed  # Seed database
```

---

## ✅ Setup Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL with PostGIS installed or cloud database configured
- [ ] Redis installed or cloud Redis configured
- [ ] Dependencies installed (`npm install`)
- [ ] `.env` file configured
- [ ] Backend builds successfully (`npm run build`)
- [ ] Backend starts successfully (`npm run start:dev`)
- [ ] Database seeded with test data
- [ ] API health check returns healthy status
- [ ] Mobile app configuration updated
- [ ] Mobile app runs on device/emulator

---

**Ready to launch!** 🚀

Once all checklist items are complete, your MySellGuid platform is ready for development and testing.
