# MySellGuid - Local Database Setup Guide

## 🎯 Running with Local Databases (Alternative to Cloud)

This guide shows how to set up local PostgreSQL and Redis instead of cloud services.

**Note:** The cloud setup (Supabase + Upstash) is recommended and easier. Use this only if you need local databases.

---

## 📋 Prerequisites

- Ubuntu/Debian-based system
- sudo/root access
- Internet connection for package downloads

---

## 🐘 PostgreSQL Setup

### Step 1: Install PostgreSQL and PostGIS

```bash
# Update package list
sudo apt-get update

# Install PostgreSQL and PostGIS
sudo apt-get install -y postgresql postgresql-contrib postgis postgresql-15-postgis-3

# Check installation
psql --version
# Should show: psql (PostgreSQL) 15.x or higher
```

### Step 2: Start PostgreSQL Service

```bash
# Start PostgreSQL
sudo service postgresql start

# Check status
sudo service postgresql status
# Should show: "online" or "active (running)"
```

### Step 3: Create Database and Enable PostGIS

```bash
# Switch to postgres user and create database
sudo -u postgres psql << EOF
-- Create database
CREATE DATABASE mysellguid;

-- Connect to the database
\c mysellguid

-- Enable PostGIS extension
CREATE EXTENSION postgis;

-- Enable pgvector extension (optional, for future AI features)
-- CREATE EXTENSION vector;

-- Verify PostGIS
SELECT PostGIS_Version();

-- Create user (optional, or use default postgres user)
-- CREATE USER mysellguid_user WITH PASSWORD 'secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE mysellguid TO mysellguid_user;

\q
EOF
```

### Step 4: Configure PostgreSQL for Local Access

Edit PostgreSQL config:

```bash
# Find and edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

Add this line if not present:
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5
```

Restart PostgreSQL:
```bash
sudo service postgresql restart
```

### Step 5: Test Connection

```bash
# Test connection
psql -U postgres -d mysellguid -c "SELECT PostGIS_Version();"

# Should return PostGIS version info
```

---

## 🔴 Redis Setup

### Step 1: Install Redis

```bash
# Install Redis
sudo apt-get install -y redis-server

# Check installation
redis-cli --version
# Should show: redis-cli 7.x or higher
```

### Step 2: Configure Redis

Edit Redis config:

```bash
sudo nano /etc/redis/redis.conf
```

Find and update these settings:
```conf
# Bind to localhost
bind 127.0.0.1

# Set max memory (adjust based on your system)
maxmemory 256mb
maxmemory-policy allkeys-lru

# Enable persistence (optional)
save 900 1
save 300 10
save 60 10000
```

### Step 3: Start Redis

```bash
# Start Redis
sudo service redis-server start

# Or run in foreground for testing
redis-server

# Or run as daemon
redis-server --daemonize yes
```

### Step 4: Test Redis

```bash
# Test connection
redis-cli ping
# Should return: PONG

# Test set/get
redis-cli SET test "Hello"
redis-cli GET test
# Should return: "Hello"
```

---

## ⚙️ Update Backend Configuration

Once local databases are running, update `backend/.env`:

```env
# ========================================
# DATABASE (PostgreSQL with PostGIS) - LOCAL
# ========================================
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres  # Or your custom password
DATABASE_NAME=mysellguid

# ========================================
# REDIS (Caching & Background Jobs) - LOCAL
# ========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=  # Leave empty unless you set one

# ========================================
# JWT AUTHENTICATION - REQUIRED
# ========================================
JWT_SECRET=dev-secret-change-in-production-abc123xyz789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-xyz789abc123
JWT_REFRESH_EXPIRES_IN=30d
```

---

## 🚀 Start Backend with Local Databases

```bash
cd /home/user/mysellguid/backend

# Start backend
npm run start:dev

# You should see successful connection logs
```

Expected logs:
```
[Nest] INFO [InstanceLoader] TypeOrmModule dependencies initialized
[Nest] INFO [InstanceLoader] BullModule dependencies initialized
...
🚀 Application is running on: http://localhost:3000/api
```

---

## 🌱 Seed Database

```bash
# Seed with test data
curl -X POST http://localhost:3000/api/seed

# Should return:
# {"users": 2, "stores": 5, "sales": 10}
```

---

## ✅ Verify Everything Works

### 1. Check Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "database": {
      "status": "healthy",
      "postgis": "3.3.x"
    },
    "redis": {
      "status": "healthy"
    }
  }
}
```

### 2. Check Database Directly

```bash
# Connect to database
psql -U postgres -d mysellguid

# List tables
\dt

# You should see: users, stores, sales, etc.

# Check data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM stores;
SELECT COUNT(*) FROM sales;

# Check PostGIS
SELECT name, ST_AsText(location) FROM stores LIMIT 3;

\q
```

### 3. Check Redis Directly

```bash
# Check Redis keys
redis-cli KEYS '*'

# Check queue
redis-cli LLEN bull:notifications:wait
```

---

## 🛠️ Useful Commands

### PostgreSQL

```bash
# Start/stop/restart
sudo service postgresql start
sudo service postgresql stop
sudo service postgresql restart

# Status
sudo service postgresql status

# Access database
psql -U postgres -d mysellguid

# Backup database
pg_dump -U postgres mysellguid > backup.sql

# Restore database
psql -U postgres -d mysellguid < backup.sql

# Drop and recreate (WARNING: deletes all data!)
sudo -u postgres psql -c "DROP DATABASE mysellguid;"
sudo -u postgres psql -c "CREATE DATABASE mysellguid;"
sudo -u postgres psql mysellguid -c "CREATE EXTENSION postgis;"
```

### Redis

```bash
# Start/stop/restart
sudo service redis-server start
sudo service redis-server stop
sudo service redis-server restart

# Status
sudo service redis-server status

# CLI access
redis-cli

# Clear all data (WARNING!)
redis-cli FLUSHALL

# Monitor commands
redis-cli MONITOR

# Check memory usage
redis-cli INFO memory
```

---

## 🔧 Troubleshooting

### PostgreSQL Issues

**Problem**: `peer authentication failed`
**Solution**: Edit `/etc/postgresql/15/main/pg_hba.conf`, change `peer` to `md5` for local connections

**Problem**: `could not connect to server`
**Solution**:
```bash
sudo service postgresql start
sudo service postgresql status
```

**Problem**: `database "mysellguid" does not exist`
**Solution**: Create it:
```bash
sudo -u postgres createdb mysellguid
sudo -u postgres psql mysellguid -c "CREATE EXTENSION postgis;"
```

**Problem**: `permission denied` errors
**Solution**: Grant permissions:
```bash
sudo -u postgres psql -c "GRANT ALL ON DATABASE mysellguid TO postgres;"
```

### Redis Issues

**Problem**: `Could not connect to Redis at 127.0.0.1:6379: Connection refused`
**Solution**: Start Redis:
```bash
sudo service redis-server start
```

**Problem**: Redis not starting
**Solution**: Check logs:
```bash
sudo tail -f /var/log/redis/redis-server.log
```

**Problem**: Port already in use
**Solution**: Kill existing Redis:
```bash
sudo pkill redis-server
redis-server --daemonize yes
```

---

## 📊 Performance Tuning (Optional)

### PostgreSQL

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf
```

Recommended settings for development:
```conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 16MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### Redis

```bash
# Edit redis.conf
sudo nano /etc/redis/redis.conf
```

Recommended settings:
```conf
maxmemory 512mb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

---

## 🔐 Security (Production)

### PostgreSQL

```bash
# Create dedicated user
sudo -u postgres psql << EOF
CREATE USER mysellguid_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE mysellguid TO mysellguid_user;
\c mysellguid
GRANT ALL ON ALL TABLES IN SCHEMA public TO mysellguid_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO mysellguid_user;
EOF
```

Update `.env`:
```env
DATABASE_USER=mysellguid_user
DATABASE_PASSWORD=your_secure_password_here
```

### Redis

```bash
# Set password
sudo nano /etc/redis/redis.conf
```

Add:
```conf
requirepass your_strong_password_here
```

Restart:
```bash
sudo service redis-server restart
```

Update `.env`:
```env
REDIS_PASSWORD=your_strong_password_here
```

---

## 📦 Docker Alternative (Easiest Local Setup)

If you have Docker installed, use this instead:

```bash
cd /home/user/mysellguid/infrastructure/docker

# Start databases
docker-compose up -d postgres redis

# Check status
docker ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

This is the easiest way to run local databases!

---

## 🎯 Summary

### What You Installed
- ✅ PostgreSQL 15+ with PostGIS
- ✅ Redis 7+
- ✅ Database user and permissions
- ✅ Test data seeded

### What You Can Do Now
- ✅ Run backend entirely offline
- ✅ Full control over data
- ✅ No cloud service dependencies
- ✅ Faster for local development

### When to Use Local vs Cloud
- **Local**: Development, testing, full control
- **Cloud**: Production, easier setup, no maintenance

---

## 🚀 Next Steps

1. Backend is running locally ✅
2. Seed database ✅
3. Test all endpoints ✅
4. Start mobile app
5. Build features!

**Your local environment is now production-ready!** 🎊
