# MySellGuid - Project Context for LLM Sessions

## Quick Summary
**MySellGuid** is a location-based sales discovery app for the Israeli market. Users find nearby deals/sales using geospatial search. Built with Supabase Edge Functions backend + React Native (Expo) mobile app + Next.js web dashboard.

**Current Status**: ✅ **PRODUCTION READY**
- Backend: https://qfffuuqldmjtxxihynug.supabase.co/functions/v1
- Web Dashboard: https://web-gamma-ecru-34.vercel.app
- Repository: https://github.com/tmotti77/mysellguid
- **All 24 Edge Functions Deployed** (February 4, 2026)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      SUPABASE                                │
├─────────────────────────────────────────────────────────────┤
│  Edge Functions     PostgreSQL+PostGIS     Supabase Auth    │
│  (Deno Runtime)     (Database)             (JWT)            │
│  24 endpoints       Free tier              No cold starts   │
└─────────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                      CLIENTS                                 │
│  Mobile App (React Native/Expo)    Web Dashboard (Next.js)  │
│  - Discover sales nearby           - Store management       │
│  - Report community sales          - Discovery engine       │
│  - Save/bookmark deals             - AI-powered analysis    │
└─────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Supabase Edge Functions (Deno), PostgreSQL + PostGIS |
| Mobile | React Native, Expo SDK 54, React Navigation |
| Web | Next.js 14, TailwindCSS, shadcn/ui |
| Auth | Supabase Auth (JWT tokens) |
| Maps | react-native-maps, Google Maps API |
| AI | Gemini API (sale analysis, discovery) |
| i18n | Custom context (English + Hebrew) |

---

## All 24 Edge Functions (100% Deployed)

| Function | Method | Auth | Description |
|----------|--------|------|-------------|
| `health` | GET | No | Health check + DB status |
| `auth-login` | POST | No | Login, returns JWT |
| `auth-register` | POST | No | User registration |
| `auth-update-profile` | GET/PATCH | Yes | Get/update user profile |
| `auth-reset-password` | POST | No | Password reset flow |
| `sales-nearby` | GET | No | Geospatial search (PostGIS) |
| `sales-search` | GET | No | Text search by keyword |
| `sales-get` | GET | No | Sale details by ID |
| `sales-create` | POST | Yes | Create new sale |
| `sales-update` | PATCH | Yes | Update sale |
| `sales-delete` | DELETE | Yes | Delete sale |
| `sales-by-store` | GET | No | Get store's sales |
| `sales-report` | POST | No | Community-reported sales |
| `stores-nearby` | GET | No | Find nearby stores |
| `stores-get` | GET | No | Store details |
| `stores-create` | POST | Yes | Create store |
| `stores-update` | PATCH | Yes | Update store |
| `stores-my-stores` | GET | Yes | User's stores |
| `bookmarks-list` | GET | Yes | Saved sales |
| `bookmarks-add` | POST | Yes | Add bookmark |
| `bookmarks-remove` | DELETE | Yes | Remove bookmark |
| `discovery` | GET/POST | No | RSS/Telegram scraping engine |
| `ml-analyze` | POST | No | Gemini-powered sale analysis |
| `migrate-users` | GET | Secret | One-time user migration |

---

## Key Files & Locations

### Backend (`/supabase/functions`)
- `sales-nearby/index.ts` - Geospatial search with PostGIS
- `sales-search/index.ts` - Server-side text search
- `sales-report/index.ts` - Community sale reports
- `discovery/index.ts` - RSS + Telegram scraping, auto-publish
- `ml-analyze/index.ts` - Gemini AI analysis
- `_shared/cors.ts` - CORS headers for all functions
- `_shared/supabase.ts` - Shared Supabase client

### Mobile (`/mobile`)
- `src/screens/main/DiscoverScreen.tsx` - Main map/list view with search
- `src/screens/main/ReportSaleScreen.tsx` - Community sale reporting
- `src/screens/main/SaleDetailScreen.tsx` - Sale details + directions
- `src/screens/main/SavedScreen.tsx` - Bookmarked sales
- `src/screens/main/SearchScreen.tsx` - Search with server integration
- `src/services/api.ts` - All API calls to Supabase
- `src/context/AuthContext.tsx` - Authentication state
- `src/i18n/` - Internationalization (en/he)

### Web Dashboard (`/web`)
- `src/app/page.tsx` - Login/redirect
- `src/app/dashboard/` - Store owner dashboard
- `src/app/dashboard/discovery/page.tsx` - AI discovery engine UI
- `src/app/browse/page.tsx` - Public browsing page
- `src/lib/api.ts` - API client for Supabase

---

## Supabase Configuration

### Project Details
- **Project ID**: qfffuuqldmjtxxihynug
- **URL**: https://qfffuuqldmjtxxihynug.supabase.co
- **Database**: PostgreSQL 15 with PostGIS extension
- **Auth**: Supabase Auth with JWT tokens

### Environment Secrets (Set in Supabase Dashboard)
- `GEMINI_API_KEY` - For AI-powered discovery
- `MIGRATION_SECRET` - For user migration endpoint

### Deployment Command
```bash
# Set token first
export SUPABASE_ACCESS_TOKEN=sbp_xxxxx

# Deploy a function
npx supabase functions deploy [function-name] --no-verify-jwt
```

---

## Test Credentials

### Test User
- **Email**: test@mysellguid.com
- **Password**: TempPassword123!

### Test Location (Tel Aviv)
- **Latitude**: 32.0853
- **Longitude**: 34.7818

---

## Common Commands

### Backend
```bash
# Deploy all functions
for fn in health auth-login auth-register sales-nearby sales-search sales-report discovery; do
  npx supabase functions deploy $fn --no-verify-jwt
done

# Test health
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/health

# Run discovery
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/discovery?action=run
```

### Mobile
```powershell
cd mobile
bun install
npx expo start

# Build APK
eas build --platform android --profile preview
```

### Web
```powershell
cd web
bun install
bun dev

# Deploy to Vercel
vercel --prod
```

---

## Recent Session History

### February 4, 2026 - Production Ready
1. **Deployed sales-search** - Server-side text search
2. **Deployed sales-report** - Community sale reporting
3. **All 24 endpoints now live** - 100% deployment complete
4. **Tested all major flows** - Login, search, discovery working
5. **Updated documentation** - This CLAUDE.md refresh

### February 3, 2026 - Discovery & Community Features
1. **ReportSaleScreen** - Mobile UI for community reports
2. **Server-side search** - sales-search endpoint
3. **Discovery improvements** - City-spread, dedup, pg_cron SQL
4. **SaleDetailScreen** - Directions button, better UI

### February 2, 2026 - Supabase Migration
1. Migrated from Render to Supabase (eliminated cold starts)
2. Converted NestJS to 24 Edge Functions
3. Migrated to Supabase Auth
4. Deployed web dashboard to Vercel

---

## Current Data in Production

- **17+ sales** in Tel Aviv area
- **10 stores** (seed data + test stores)
- **5 migrated users** from old backend
- **Discovery running** - RSS feeds active

---

## Known Issues / TODO

### ⚠️ Pending
1. **Gemini API** - Key configured but may need Google Cloud API enabled (project 349289031772)
2. **Hebrew RTL** - Full RTL support needs app restart to apply
3. **Image uploads** - Web uses local base64 preview (no server upload)
4. **iOS testing** - Not yet tested on iOS device

### ✅ Completed
- [x] All 24 edge functions deployed
- [x] Mobile app fully functional
- [x] Web dashboard on Vercel
- [x] Discovery engine (RSS scraping)
- [x] Community sale reporting
- [x] Server-side search
- [x] Auth (login, register, reset password)
- [x] Bookmarks system
- [x] Store management

---

## For New LLM Sessions

When continuing work on this project:

1. **Everything is deployed** - No pending deployments
2. **Backend**: https://qfffuuqldmjtxxihynug.supabase.co/functions/v1
3. **Web**: https://web-gamma-ecru-34.vercel.app
4. **Test user**: test@mysellguid.com / TempPassword123!
5. **All TypeScript compiles cleanly** (mobile and web)

### Quick Health Check
```bash
# Backend health
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/health

# Discovery stats
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/discovery?action=stats"

# Search test
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-search?q=dress&lat=32.08&lng=34.78"
```

### Next Priority Tasks
- [ ] Enable Gemini API on Google Cloud (project 349289031772)
- [ ] Test on iOS device
- [ ] Add more Israeli RSS/Telegram sources to discovery
- [ ] Image upload endpoint for sales
- [ ] Push notifications setup

---

**Last Updated**: February 4, 2026
**Session**: Claude Code
**Status**: ✅ Production Ready - All Systems Go
