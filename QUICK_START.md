# MySellGuid - Quick Start Guide

**Everything you need to get started in 5 minutes!**

---

## ✅ What's Already Done

Your backend is **COMPLETE and WORKING**:

### ✅ Features Implemented
- Authentication (JWT) - Login, register, protected routes
- User management - Profiles, preferences, location
- Store management - CRUD, search, categories
- **Sales with geospatial search** (MAIN FEATURE) - Find sales within any radius
- Firebase push notifications (infrastructure ready)
- Database seeding with test data
- Comprehensive testing (all tests passing)

### ✅ Test Data Available
- **2 users**: `test@mysellguid.com` and `store@mysellguid.com` (password: `password123`)
- **5 stores** in Tel Aviv (Fashion, Electronics, Home, Sports, Beauty)
- **10 sales** with realistic discounts (20-60% off)

---

## 🚀 Start the Backend (RIGHT NOW!)

```bash
# 1. Start databases (if not running)
cd /home/kali/mysellguid
sudo docker start mysellguid-postgres mysellguid-redis

# 2. Start backend
cd backend
npm run start:dev
```

**Backend is now running at:** http://localhost:3000
**API Docs:** http://localhost:3000/api

---

## 🧪 Test Everything Works

```bash
# Run the automated test script
cd /home/kali/mysellguid
./test-api.sh
```

You should see: **✓ All 10 tests PASSED**

---

## 📱 Try the API Manually

### 1. Seed the Database
```bash
curl -X POST http://localhost:3000/api/seed
```

### 2. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@mysellguid.com", "password": "password123"}'
```

Copy the `accessToken` from the response.

### 3. Find Nearby Sales (Tel Aviv, 5km radius)
```bash
curl "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000"
```

You'll see 10 sales sorted by distance with full details!

### 4. Get Your Profile (Protected Endpoint)
```bash
TOKEN="paste-your-token-here"
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📖 Important Documents

| Document | Purpose |
|----------|---------|
| **PROJECT_STATUS.md** | Complete status: what's done, what needs to be done |
| **FIREBASE_SETUP.md** | How to configure push notifications |
| **README.md** | Full project documentation |
| **test-api.sh** | Automated testing script |

---

## 🎯 Next Steps (Priority Order)

### Week 1-2: Mobile App (URGENT)
Create React Native app to display sales on map:
- Map view with sale markers
- Geolocation (get user location)
- Display nearby sales
- Sale details screen
- Authentication integration

### Week 3: Firebase
- Create Firebase project (1 day)
- Configure backend credentials
- Test push notifications
- See `FIREBASE_SETUP.md` for guide

### Week 4-5: Store Dashboard
Create Next.js web app for store owners:
- Login/register stores
- Create and manage sales
- Upload images
- View analytics

### Week 6: Deployment
- Deploy backend to cloud (AWS, DigitalOcean, Railway)
- Set up production database
- Deploy mobile app to TestFlight/Google Play Beta
- Go live! 🚀

---

## 💻 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Get JWT token
- `POST /api/auth/refresh` - Refresh token

### Sales (Main Feature)
- `GET /api/sales/nearby?lat=X&lng=Y&radius=Z` - **Find nearby sales**
- `GET /api/sales/search?query=X&category=Y` - Search sales
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create sale (STORE_OWNER only)

### Stores
- `GET /api/stores/nearby?lat=X&lng=Y&radius=Z` - Find nearby stores
- `GET /api/stores/:id` - Get store details
- `POST /api/stores` - Create store (STORE_OWNER only)

### Users
- `GET /api/users/me` - Get profile (requires JWT)
- `PATCH /api/users/me` - Update profile
- `PATCH /api/users/me/fcm-token` - Set notification token

### Database
- `POST /api/seed` - Populate with test data

### Notifications
- `POST /api/notifications/test` - Send test notification
- `POST /api/notifications/subscribe/:category` - Subscribe to category

---

## 🧰 Useful Commands

```bash
# Start backend in development mode
cd backend && npm run start:dev

# Seed database with test data
curl -X POST http://localhost:3000/api/seed

# Run all API tests
cd /home/kali/mysellguid && ./test-api.sh

# View API documentation
open http://localhost:3000/api

# Check backend logs
# (Look at the terminal where npm run start:dev is running)

# Stop backend
# Press Ctrl+C in the terminal

# Stop databases
sudo docker stop mysellguid-postgres mysellguid-redis
```

---

## 🔥 Quick Demo

Want to see it work right now? Run this:

```bash
# Start everything
cd /home/kali/mysellguid
sudo docker start mysellguid-postgres mysellguid-redis
cd backend && npm run start:dev &

# Wait 10 seconds for backend to start, then:
sleep 10

# Seed database
curl -X POST http://localhost:3000/api/seed

# Find sales near Tel Aviv
curl "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000" | head -50
```

You'll see JSON with 10 nearby sales!

---

## ❓ Need Help?

1. **Backend not starting?**
   - Check databases are running: `sudo docker ps`
   - Check `.env` file exists: `ls backend/.env`
   - Check logs for errors

2. **Tests failing?**
   - Make sure backend is running
   - Run seed endpoint first: `curl -X POST http://localhost:3000/api/seed`
   - Check `./test-api.sh` output for specific errors

3. **Can't find nearby sales?**
   - Make sure you've seeded the database
   - Check coordinates are in Tel Aviv area (lat: 32.08, lng: 34.78)
   - Try larger radius: `radius=10000` (10km)

4. **Database errors?**
   - Restart Docker containers: `sudo docker restart mysellguid-postgres`
   - Check PostGIS extension: `psql -U mysellguid -d mysellguid -c "SELECT PostGIS_Version();"`

---

## 📊 Current Status

| Component | Status | Next Step |
|-----------|--------|-----------|
| Backend | ✅ 85% Complete | Polish & deploy |
| Database | ✅ Working | Add more test data |
| Authentication | ✅ Complete | - |
| Geospatial Search | ✅ Complete | - |
| Push Notifications | 🔄 Ready | Configure Firebase |
| Mobile App | ⬜ Not started | **START HERE** |
| Store Dashboard | ⬜ Not started | Week 4-5 |
| Image Storage | ⬜ Planned | Week 3-4 |
| AI/ML | ⬜ Planned | Post-MVP |
| Social Scraping | ⬜ Planned | Post-MVP |

---

## 🎉 Success!

If you can run `./test-api.sh` and see all tests passing, **YOU'RE READY TO BUILD THE MOBILE APP!**

The backend is solid, tested, and waiting for a beautiful React Native interface.

---

**Questions?** Check PROJECT_STATUS.md for detailed information.
**Problems?** All code is committed and ready to push to GitHub.
**Excited?** Let's build this! 🚀
