# MySellGuid - Complete Cloud Setup Guide
## Get Your App Running in 15 Minutes! 🚀

Follow these steps exactly and you'll have a working app!

---

## Step 1: Set Up PostgreSQL Database with Supabase (5 minutes)

### 1.1 Create Supabase Account
1. Go to: https://supabase.com/dashboard
2. Click **"Start your project"** or **"Sign Up"**
3. Sign up with GitHub or email

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in:
   - **Name**: `mysellguid` (or any name you like)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (should be selected)
3. Click **"Create new project"**
4. ⏰ Wait 2-3 minutes while it sets up (you'll see a progress bar)

### 1.3 Get Database Connection Details
Once your project is ready:

1. Go to **Settings** (gear icon in sidebar)
2. Click **"Database"**
3. Scroll down to **"Connection string"**
4. Select **"URI"** tab
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### 1.4 Extract Connection Details
From your connection string, extract these values:

**Example connection string:**
```
postgresql://postgres:myPassword123@db.abcdefgh.supabase.co:5432/postgres
```

Extract:
- **Host**: `db.abcdefgh.supabase.co`
- **Port**: `5432`
- **User**: `postgres`
- **Password**: `myPassword123` (the password you created)
- **Database**: `postgres`

**✅ Checkpoint:** You should have 5 pieces of information written down!

---

## Step 2: Set Up Redis with Upstash (5 minutes)

### 2.1 Create Upstash Account
1. Go to: https://console.upstash.com
2. Click **"Sign Up"**
3. Sign up with GitHub or email
4. Verify your email if needed

### 2.2 Create Redis Database
1. Click **"Create Database"**
2. Fill in:
   - **Name**: `mysellguid-redis`
   - **Type**: Regional
   - **Region**: Choose closest to you
   - **TLS**: Enabled (default)
3. Click **"Create"**

### 2.3 Get Redis Connection Details
1. Click on your newly created database
2. Scroll down to **"REST API"** section
3. You'll see connection details. Copy these:
   - **Endpoint**: `https://xxxxx.upstash.io`
   - **Port**: Usually `6379` or displayed
   - **Password**: Shows in the details

Or look for **"Redis CLI"** section:
```
redis-cli -h xxxxx.upstash.io -p 6379 -a your-password-here
```

Extract:
- **Host**: `xxxxx.upstash.io`
- **Port**: `6379`
- **Password**: `your-password-here`

**✅ Checkpoint:** You should have Redis host, port, and password!

---

## Step 3: Configure Your Backend (2 minutes)

### 3.1 Update Environment Variables

Open the file: `backend/.env`

Replace these sections with your values:

```env
# ========================================
# DATABASE (PostgreSQL with PostGIS) - REQUIRED
# ========================================
DATABASE_HOST=db.YOUR-PROJECT.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-supabase-password
DATABASE_NAME=postgres

# ========================================
# REDIS (Caching & Background Jobs) - REQUIRED
# ========================================
REDIS_HOST=your-redis-id.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-upstash-password

# ========================================
# JWT AUTHENTICATION - REQUIRED
# ========================================
JWT_SECRET=dev-secret-change-in-production-abc123xyz789
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-xyz789abc123
```

**Example with actual values:**
```env
# DATABASE
DATABASE_HOST=db.abcdefgh.supabase.co
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=mySupabasePass123!
DATABASE_NAME=postgres

# REDIS
REDIS_HOST=grand-squirrel-12345.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=AaBbCcDd123456789
```

### 3.2 Save the File
- Save `backend/.env`
- Make sure there are no typos!

**✅ Checkpoint:** Your `.env` file is configured!

---

## Step 4: Start the Backend (3 minutes)

### 4.1 Open Terminal and Navigate to Backend
```bash
cd /home/user/mysellguid/backend
```

### 4.2 Start the Development Server
```bash
npm run start:dev
```

### 4.3 Watch for Success Messages
You should see:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [InstanceLoader] AppModule dependencies initialized
[Nest] INFO [RoutesResolver] Mapped {/api/health, GET}
...
🚀 Application is running on: http://localhost:3000/api
📚 Swagger docs available at: http://localhost:3000/api/docs
```

**If you see errors:**
- Check your database credentials in `.env`
- Make sure you copied them correctly
- Check that Supabase project is fully started

**✅ Checkpoint:** Backend is running without errors!

---

## Step 5: Seed the Database (1 minute)

### 5.1 Open a NEW Terminal Window
Keep the backend running in the first terminal!

### 5.2 Seed Test Data
```bash
curl -X POST http://localhost:3000/api/seed
```

### 5.3 Expected Response
You should see:
```json
{
  "users": 2,
  "stores": 5,
  "sales": 10
}
```

This creates:
- ✅ 2 test users
- ✅ 5 stores in Tel Aviv
- ✅ 10 sales with discounts

**✅ Checkpoint:** Database is populated with test data!

---

## Step 6: Test the API (2 minutes)

### 6.1 Health Check
```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-07T...",
  "services": {
    "database": {
      "status": "healthy",
      "message": "Database connection successful",
      "postgis": "3.3.x"
    },
    "redis": {
      "status": "healthy",
      "message": "Redis connection successful"
    }
  }
}
```

### 6.2 Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@mysellguid.com", "password": "password123"}'
```

**Expected response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "test@mysellguid.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### 6.3 Test Geospatial Search
```bash
curl "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000"
```

**Expected:** You should see 10 sales with distances!

### 6.4 Open Swagger Docs
Open in browser: http://localhost:3000/api/docs

You can test all endpoints here!

**✅ Checkpoint:** API is working perfectly!

---

## Step 7: Start the Mobile App (Optional - 5 minutes)

### 7.1 Update Mobile Configuration
Edit file: `mobile/app.json`

Find this section and update:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://YOUR-COMPUTER-IP:3000/api"
    }
  }
}
```

**Find your IP:**
```bash
# On Linux/Mac
hostname -I | awk '{print $1}'

# Or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

Example:
```json
"apiUrl": "http://192.168.1.100:3000/api"
```

### 7.2 Start Mobile App
```bash
cd /home/user/mysellguid/mobile
npm start
```

### 7.3 Test on Your Phone
1. Install **Expo Go** app from App Store / Play Store
2. Scan the QR code shown in terminal
3. App will load on your phone!

**✅ Checkpoint:** Mobile app is running!

---

## 🎉 Success! You're Done!

### What You Have Now:
- ✅ Backend API running at http://localhost:3000/api
- ✅ PostgreSQL database with PostGIS (on Supabase)
- ✅ Redis cache (on Upstash)
- ✅ Health monitoring endpoints
- ✅ Test data loaded (2 users, 5 stores, 10 sales)
- ✅ Mobile app ready to use
- ✅ Full API documentation at http://localhost:3000/api/docs

### Test User Credentials:
- **Email**: test@mysellguid.com
- **Password**: password123

### Test Store Owner:
- **Email**: store@mysellguid.com
- **Password**: password123

---

## 📱 Quick Commands Reference

```bash
# Start backend
cd /home/user/mysellguid/backend
npm run start:dev

# Seed database (only needed once)
curl -X POST http://localhost:3000/api/seed

# Health check
curl http://localhost:3000/api/health

# Start mobile app
cd /home/user/mysellguid/mobile
npm start

# API Documentation
open http://localhost:3000/api/docs
```

---

## 🔧 Troubleshooting

### Backend won't start?
1. Check `.env` has correct database credentials
2. Verify Supabase project is running (check dashboard)
3. Verify Upstash Redis is created
4. Check for typos in connection strings

### "Database connection failed"?
1. Go to Supabase dashboard
2. Verify project is running (green status)
3. Check password is correct
4. Try reconnecting: Settings → Database → Reset password

### "Redis connection failed"?
1. Go to Upstash console
2. Verify database is created
3. Check password in dashboard
4. Copy credentials again

### Seed endpoint returns error?
- Make sure backend is running first
- Check backend logs for error details
- Verify PostGIS extension (should be automatic on Supabase)

### Mobile app can't connect?
1. Make sure backend is running
2. Check you used your computer's IP, not `localhost`
3. Make sure phone is on same WiFi network
4. Check firewall isn't blocking port 3000

---

## 🚀 Next Steps

Now that it's working:

1. **Explore the API** at http://localhost:3000/api/docs
2. **Test the mobile app** with real location
3. **Create sales** via API as store owner
4. **Add Firebase** for push notifications (see FIREBASE_SETUP.md)
5. **Deploy to production** (see DEPLOYMENT_SUMMARY.md)

---

## 📞 Need Help?

If you get stuck:
1. Check the backend logs (in the terminal where you ran `npm run start:dev`)
2. Check health endpoint: `curl http://localhost:3000/api/health`
3. Review SETUP_GUIDE.md for detailed troubleshooting
4. Check PROJECT_STATUS.md for current status

---

**Congratulations! Your MySellGuid platform is now fully operational! 🎊**
