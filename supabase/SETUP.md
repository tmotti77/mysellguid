# Supabase Migration Setup Guide

## Step 1: Run Database Migration

Go to Supabase Dashboard → SQL Editor and run this migration:

**File:** `supabase/migrations/20260202_create_nearby_functions.sql`

This creates:
- `get_nearby_sales()` - PostGIS function for nearby sales search
- `get_nearby_stores()` - PostGIS function for nearby stores search

## Step 2: Get Your Keys

You need:
1. **Service Role Key** (NOT anon key) - Settings → API → service_role (secret)
2. **Database Password** - Settings → Database → Connection string password
3. **Anon Key** - Settings → API → anon (public)

## Step 3: Deploy Edge Functions

```bash
cd C:\Users\tmott\Desktop\mysellantigrav\mysellguid-2

# Set your Supabase credentials
$env:SUPABASE_ACCESS_TOKEN="YOUR_ACCESS_TOKEN"

# Deploy all functions
npx supabase functions deploy health
npx supabase functions deploy sales-nearby
npx supabase functions deploy stores-nearby
```

## Step 4: Set Environment Secrets

Each function needs these environment variables:

```bash
npx supabase secrets set SUPABASE_URL=https://qfffuuqldmjtxxihynug.supabase.co
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
npx supabase secrets set SUPABASE_ANON_KEY=YOUR_ANON_KEY
npx supabase secrets set GOOGLE_GEMINI_API_KEY=YOUR_GEMINI_KEY
```

## Step 5: Test Endpoints

Test health:
```bash
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/health
```

Test nearby sales:
```bash
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-nearby?lat=32.0853&lng=34.7818&radius=5000"
```

## Step 6: Update Mobile App

Update `mobile/app.json`:
```json
"extra": {
  "apiUrl": "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1"
}
```

## Migration Status

### ✅ Completed Functions:
- [x] health - Server health check
- [x] sales-nearby - PostGIS nearby search
- [x] stores-nearby - PostGIS nearby stores

### 🚧 TODO Functions:
- [ ] sales-get - Get sale by ID
- [ ] sales-create - Create new sale
- [ ] sales-update - Update sale
- [ ] sales-delete - Delete sale
- [ ] stores-get - Get store by ID
- [ ] stores-create - Create store
- [ ] stores-my-stores - Get user's stores
- [ ] auth-register - User registration (use Supabase Auth)
- [ ] auth-login - User login (use Supabase Auth)
- [ ] bookmarks-list - Get user bookmarks
- [ ] bookmarks-add - Add bookmark
- [ ] bookmarks-remove - Remove bookmark

### 🔮 Advanced TODO:
- [ ] ml-analyze-image - AI image analysis
- [ ] ml-extract-url - URL extraction
- [ ] ml-analyze-screenshot - Screenshot OCR
- [ ] discovery-telegram - Telegram monitoring (pg_cron)
- [ ] discovery-rss - RSS monitoring (pg_cron)
- [ ] discovery-apify - Instagram scraping (pg_cron)

## Notes

- Edge Functions use Deno runtime (not Node.js)
- PostGIS queries run as database functions (faster)
- No cold starts on Supabase Edge Functions
- Free tier: 500K function invocations/month
- Database: PostgreSQL with PostGIS extension already enabled
