# MySellGuid - Project Context for LLM Sessions

## Quick Summary
**MySellGuid** is a location-based sales discovery app for the Israeli market. Users find nearby deals/sales using geospatial search. Built with NestJS backend + React Native (Expo) mobile app.

**Current Status**: ✅ **DEPLOYED AND WORKING**
- Backend: https://mysellguid-api.onrender.com
- Repository: https://github.com/tmotti77/mysellguid

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      RENDER.COM                              │
├─────────────────────────────────────────────────────────────┤
│  Backend API        PostgreSQL+PostGIS     Redis            │
│  (NestJS)           (Database)             (Cache)          │
│  Port 10000         dpg-d4n9ef24d50c73fa37g0-a              │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                      CLIENTS                                 │
│  Mobile App (React Native/Expo)    Web Dashboard (Next.js)  │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | NestJS, TypeORM, PostgreSQL + PostGIS |
| Mobile | React Native, Expo SDK 54, React Navigation |
| Web | Next.js 14, TailwindCSS |
| Cache | Redis (Bull queues) |
| Auth | JWT (access + refresh tokens) |
| Maps | react-native-maps, Google Maps API |
| AI | Gemini API (image analysis) |
| i18n | Custom context (English + Hebrew) |

---

## Key Files & Locations

### Backend (`/backend`)
- `src/modules/sales/sales.service.ts` - Geospatial search with PostGIS
- `src/modules/auth/` - JWT authentication
- `src/seed/seed.service.ts` - Database seeding (coordinates: 32.1544678, 34.9167442)
- `src/seed/seed.controller.ts` - Secured with SEED_SECRET
- `src/modules/ml/ml.service.ts` - Gemini/OpenAI image analysis
- `.env.example` - All environment variables documented

### Mobile (`/mobile`)
- `src/screens/main/DiscoverScreen.tsx` - Main map/list view
- `src/screens/main/SaleDetailScreen.tsx` - Sale details
- `src/screens/main/StoreDetailScreen.tsx` - Store details
- `src/services/api.ts` - API client with interceptors
- `src/context/AuthContext.tsx` - Authentication state
- `src/i18n/` - Internationalization (en/he)
- `app.json` - Expo config, apiUrl setting

### Infrastructure (`/infrastructure/docker`)
- `docker-compose.yml` - PostgreSQL + Redis + pgAdmin

---

## Environment Variables

### Backend (Required for Production)
```env
NODE_ENV=production
DATABASE_URL=postgresql://...  # From Render PostgreSQL
REDIS_URL=redis://...          # From Render Redis
SEED_SECRET=<32-char-random>   # For /api/seed endpoint
JWT_SECRET=<64-char-random>    # For auth tokens
JWT_REFRESH_SECRET=<64-char-random>
```

### Optional
```env
AI_PROVIDER=gemini
GOOGLE_GEMINI_API_KEY=...
GOOGLE_MAPS_API_KEY=...
OPENAI_API_KEY=...
```

---

## API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | No | Health check |
| `/api/auth/login` | POST | No | Login, returns JWT |
| `/api/auth/register` | POST | No | User registration |
| `/api/sales/nearby` | GET | No | Geospatial search |
| `/api/sales/:id` | GET | No | Sale details |
| `/api/stores/:id` | GET | No | Store details |
| `/api/bookmarks` | GET/POST/DELETE | Yes | Save sales |
| `/api/seed?secret=XXX` | POST | Secret | Seed database |

---

## Test Credentials
- **Email**: test@mysellguid.com
- **Password**: password123

---

## Common Commands

### Local Development
```powershell
# Start Docker (PostgreSQL + Redis)
cd infrastructure/docker
docker-compose up -d

# Start Backend
cd backend
npm install
npm run start:dev

# Start Mobile
cd mobile
npm install --legacy-peer-deps
npx expo start

# Seed Database (local)
curl -X POST "http://localhost:3000/api/seed?secret=92c6d9f4bfe9e54e1dd622b0ad13c42c"
```

### Production
```powershell
# Seed Production Database
curl -X POST "https://mysellguid-api.onrender.com/api/seed?secret=YOUR_SEED_SECRET"

# Build APK
cd mobile
eas build --platform android --profile production
```

---

## Recent Fixes (December 2025)

### Session: December 7, 2025
1. **Secured seed endpoint** - Added SEED_SECRET requirement
2. **Fixed TypeError** - `store.rating.toFixed()` crash when rating undefined
   - File: `mobile/src/screens/main/StoreDetailScreen.tsx:198`
   - Fix: `(store.rating ?? 0).toFixed(1)`
3. **Fixed date null safety** - `sale.endDate` could be undefined
   - File: `mobile/src/screens/main/SaleDetailScreen.tsx:206`
4. **Exported SaleAnalysisResult** - TypeScript compilation error
   - File: `backend/src/modules/ml/ml.service.ts:4`
5. **Updated DEPLOYMENT_CHECKLIST.md** - Correct env var count (5, not 2)

---

## Known Issues / TODO

1. **Free tier cold starts** - Render sleeps after 15 min, ~30s wake time
2. **Date filtering** - Re-enabled in sales.service.ts (was disabled for testing)
3. **Hebrew RTL** - Full RTL support needs app restart
4. **Error boundaries** - Already implemented in App.tsx
5. **Gemini AI** - Implemented but needs API key to test

---

## Deployment Checklist

### Render Environment Variables (5 Required)
1. `DATABASE_URL` - From Render PostgreSQL Internal URL
2. `REDIS_URL` - From Render Redis Internal URL
3. `SEED_SECRET` - Generate: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`
4. `JWT_SECRET` - Generate 64-char random string
5. `JWT_REFRESH_SECRET` - Generate another 64-char string

### PostGIS Setup (One-time)
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

## Git Status
- **Branch**: master
- **Latest Commit**: `43b2b2e Fix: Null safety for rating and date fields`
- **Remote**: https://github.com/tmotti77/mysellguid

---

## For New LLM Sessions

When continuing work on this project:

1. **Backend is deployed** at https://mysellguid-api.onrender.com
2. **Mobile app** needs EAS rebuild after code changes
3. **Seed endpoint** requires `?secret=YOUR_SEED_SECRET`
4. **Test user**: test@mysellguid.com / password123
5. **Location**: Ramat Gan, Israel (32.1544678, 34.9167442)

### Priority Tasks
- [ ] Build new APK with latest fixes
- [ ] Test on iOS device
- [ ] Add real store images
- [ ] Implement push notifications (Firebase)
- [ ] Deploy web dashboard to Vercel

---

**Last Updated**: December 7, 2025
**Maintained By**: Claude Code sessions
