# MySellGuid - Project Context for LLM Sessions

## Quick Summary
**MySellGuid** is a location-based sales discovery app for the Israeli market. Users find nearby deals/sales using geospatial search. Built with Supabase Edge Functions backend + React Native (Expo) mobile app.

**Current Status**: ✅ **DEPLOYED AND WORKING**
- Backend: https://qfffuuqldmjtxxihynug.supabase.co/functions/v1
- Repository: https://github.com/tmotti77/mysellguid
- **MIGRATED FROM RENDER TO SUPABASE** (February 2, 2026)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions     PostgreSQL+PostGIS     Supabase Auth    │
│  (Deno Runtime)     (Database)             (JWT)            │
│  16 endpoints       Free tier              No cold starts   │
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
| Backend | Supabase Edge Functions (Deno), PostgreSQL + PostGIS |
| Mobile | React Native, Expo SDK 54, React Navigation |
| Web | Next.js 14, TailwindCSS |
| Auth | Supabase Auth (JWT tokens) |
| Maps | react-native-maps, Google Maps API |
| AI | Gemini API (to be migrated) |
| i18n | Custom context (English + Hebrew) |

---

## Key Files & Locations

### Backend (`/supabase/functions`)
- `sales-nearby/index.ts` - Geospatial search with PostGIS
- `auth-register/index.ts`, `auth-login/index.ts` - Supabase Auth
- `migrate-users/index.ts` - Migrated 5 users from old backend
- `_shared/cors.ts` - CORS headers for all functions
- `_shared/supabase.ts` - Shared Supabase client
- See `API_ENDPOINTS.md` for complete endpoint reference

### Mobile (`/mobile`)
- `src/screens/main/DiscoverScreen.tsx` - Main map/list view
- `src/screens/main/SaleDetailScreen.tsx` - Sale details
- `src/screens/main/StoreDetailScreen.tsx` - Store details
- `src/services/api.ts` - **UPDATED for Supabase endpoints**
- `src/context/AuthContext.tsx` - Authentication state
- `src/i18n/` - Internationalization (en/he)
- `app.json` - Expo config, apiUrl = Supabase Edge Functions

### Documentation
- `API_ENDPOINTS.md` - Complete API reference (16 endpoints)
- `SUPABASE_MIGRATION_COMPLETE.md` - Migration guide
- `MOBILE_UPDATE_SUPABASE.md` - Mobile app changes

---

## Supabase Configuration

### Project Details
- URL: https://qfffuuqldmjtxxihynug.supabase.co
- Database: PostgreSQL 15 with PostGIS extension
- Auth: Supabase Auth with JWT tokens

### Environment Secrets (Set in Supabase Dashboard)
- `MIGRATION_SECRET` - For user migration endpoint
- Database credentials stored securely in Supabase

### Deployment
All functions deployed with:
```bash
npx supabase functions deploy [function-name] --no-verify-jwt
```

---

## API Endpoints

See `API_ENDPOINTS.md` for complete reference. Quick overview:

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/auth-login` | POST | No | Login, returns JWT |
| `/auth-register` | POST | No | User registration |
| `/sales-nearby` | GET | No | Geospatial search |
| `/sales-get/:id` | GET | No | Sale details |
| `/sales-create` | POST | Yes | Create sale |
| `/sales-update/:id` | PATCH | Yes | Update sale |
| `/sales-by-store/:id` | GET | No | Store's sales |
| `/stores-nearby` | GET | No | Find stores |
| `/stores-get/:id` | GET | No | Store details |
| `/stores-create` | POST | Yes | Create store |
| `/stores-update/:id` | PATCH | Yes | Update store |
| `/stores-my-stores` | GET | Yes | User's stores |
| `/bookmarks-list` | GET | Yes | Saved sales |
| `/bookmarks-add/:id` | POST | Yes | Add bookmark |
| `/bookmarks-remove/:id` | DELETE | Yes | Remove bookmark |
| `/migrate-users` | GET | Secret | Migrate users |

**Total: 17 endpoints, all deployed and working**

---

## Test Credentials

### Migrated Users
- **Email**: test@mysellguid.com
- **Password**: TempPassword123! (all migrated users have this temp password)

### New Users
Create via app registration or API endpoint

---

## Common Commands

### Supabase Functions
```bash
# Deploy function
npx supabase functions deploy [function-name] --no-verify-jwt

# Test endpoint
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/health
```

### Mobile Development
```powershell
# Start Mobile
cd mobile
npm install --legacy-peer-deps
npx expo start

# Build APK
eas build --platform android --profile production
```

### Testing
```bash
# Health check
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/health

# Login
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mysellguid.com","password":"TempPassword123!"}'
```

---

## Migration History

### February 2, 2026 - Supabase Migration
1. **Migrated from Render to Supabase** - Eliminated cold starts and hosting costs
2. **Converted NestJS to Edge Functions** - 16 Deno-based serverless functions
3. **Migrated to Supabase Auth** - Simplified authentication, removed custom JWT
4. **Preserved all data** - 5 users migrated with temporary password
5. **Updated mobile app** - All API endpoints updated to new structure
6. **Zero downtime** - Both backends ran in parallel during migration

### Benefits
- **$0/month cost** (was $7-25 on Render)
- **No cold starts** (was 30-50 seconds)
- **Better performance** - Edge functions closer to users
- **Simpler auth** - Supabase Auth built-in

### Previous Session: December 7, 2025
1. Secured seed endpoint with SEED_SECRET
2. Fixed null safety issues (rating, endDate)
3. Exported SaleAnalysisResult type
4. Updated deployment checklist

---

## Known Issues / TODO

1. ✅ **Cold starts FIXED** - Migrated to Supabase (no cold starts)
2. **Hebrew RTL** - Full RTL support needs app restart
3. **ML/AI features** - Need to migrate from old backend
4. **User profile endpoints** - Not yet implemented in Supabase
5. **Password reset** - Need to add Supabase password reset flow

---

## Supabase Deployment

### One-Time Setup
1. Created Supabase project
2. Enabled PostGIS extension in SQL Editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```
3. Set `MIGRATION_SECRET` in Supabase secrets
4. Deployed all 16 functions

### Function Deployment
```bash
export SUPABASE_ACCESS_TOKEN=your_token
npx supabase functions deploy [function-name] --no-verify-jwt
```

---

## Git Repository
- **Branch**: master
- **Remote**: https://github.com/tmotti77/mysellguid
- **Recent**: Supabase migration complete (February 2, 2026)

---

## For New LLM Sessions

When continuing work on this project:

1. **Backend is on Supabase** at https://qfffuuqldmjtxxihynug.supabase.co/functions/v1
2. **Mobile app API updated** to Supabase endpoints
3. **Test user**: test@mysellguid.com / TempPassword123!
4. **Location**: Ramat Gan, Israel (32.1544678, 34.9167442)
5. **16 endpoints deployed and working**

### Priority Tasks
- [x] Migrate backend to Supabase
- [x] Update mobile app API endpoints
- [ ] Build new APK with Supabase integration
- [ ] Migrate ML/AI features to Supabase
- [ ] Add user profile/password reset endpoints
- [ ] Test on iOS device
- [ ] Deploy web dashboard to Vercel

---

**Last Updated**: February 2, 2026
**Maintained By**: Claude Code sessions
**Current Phase**: Supabase Migration Complete ✅
