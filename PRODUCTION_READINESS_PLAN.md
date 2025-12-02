# MySellGuid Production Readiness Plan

**Generated:** December 2, 2025  
**Status:** Ready for Implementation  
**Priority:** Critical issues first, then polish

---

## EXECUTIVE SUMMARY

### Current State Assessment
| Component | Build | Tests | Lint | Status |
|-----------|-------|-------|------|--------|
| Backend | ✅ Pass | ✅ 28/28 | ⚠️ Minor | **90% Ready** |
| Web | ❌ Fail | N/A | ❌ 17 errors | **70% Ready** |
| Mobile | ⚠️ Untested | N/A | ⚠️ Unknown | **75% Ready** |

### Critical Bugs Found
1. ✅ **FIXED**: NULL images array bug in SQL queries
2. ❌ **PENDING**: Web lint errors blocking build (17 errors)
3. ⚠️ **PENDING**: Mobile design/UX issues reported by user

---

## PHASE 1: CRITICAL FIXES (Do First)

### 1.1 Fix Web Lint Errors (Blocking Build)

**Files to fix:**

| File | Errors | Fix Required |
|------|--------|--------------|
| `web/src/services/api.ts` | 5 | Replace `any` with proper types |
| `web/src/context/AuthContext.tsx` | 2 | Type the error handlers |
| `web/src/app/login/page.tsx` | 2 | Fix any + escape apostrophe |
| `web/src/app/register/page.tsx` | 1 | Type error handler |
| `web/src/app/dashboard/sales/new/page.tsx` | 1 | Type event handler |
| `web/src/app/dashboard/sales/page.tsx` | 1 | Type component |
| `web/src/app/dashboard/store/page.tsx` | 3 | Type handlers + remove unused |

**Action Items:**
```
1. [ ] Fix api.ts - Add AxiosError types
2. [ ] Fix AuthContext.tsx - Type error as unknown
3. [ ] Fix login/register pages - Type catch blocks
4. [ ] Fix dashboard pages - Remove unused imports
5. [ ] Run `npm run build` to verify
```

### 1.2 Verify Backend Image Fix

**Fixed Code:**
```sql
-- Before (BUG):
string_to_array(sale.images, ',') as images

-- After (FIXED):
COALESCE(string_to_array(NULLIF(sale.images, ''), ','), ARRAY[]::text[]) as images
```

**Files Modified:**
- `backend/src/modules/sales/sales.service.ts:143`
- `backend/src/modules/bookmarks/bookmarks.service.ts:133`

**Verification:**
```powershell
# Test with sale that has no images
curl "http://localhost:3000/api/sales/nearby?lat=32.15&lng=34.91&radius=5000"
# Verify images field is [] not null
```

---

## PHASE 2: MOBILE APP FIXES

### 2.1 Known Issues from Testing

Based on user reports, these issues were observed:

| Issue | Screen | Priority |
|-------|--------|----------|
| Sales not displaying correctly | DiscoverScreen | HIGH |
| Design/layout problems | Various | MEDIUM |
| Store connection issues | StoreScreen | HIGH |
| Image display problems | SaleCard | MEDIUM |

### 2.2 Mobile Screens to Audit

```
1. [ ] DiscoverScreen - Map markers + list view
2. [ ] SaleDetailScreen - Full sale info display
3. [ ] SavedScreen - Bookmarked sales
4. [ ] ProfileScreen - User settings
5. [ ] StoreScreen - Store owner view (if applicable)
```

### 2.3 Common Mobile Fixes Needed

**A) Coordinate Type Fix (Already done)**
```typescript
// In DiscoverScreen.tsx - ensure parseFloat is used
coordinate={{
  latitude: parseFloat(sale.latitude),
  longitude: parseFloat(sale.longitude),
}}
```

**B) Image Fallbacks**
```typescript
// Add fallback for missing images
<Image 
  source={{ uri: sale.images?.[0] || DEFAULT_SALE_IMAGE }}
  defaultSource={require('../assets/placeholder.png')}
/>
```

**C) RTL Support Verification**
```typescript
// Ensure all screens use rtl utilities
import { rtlStyle, rtlAlign } from '../utils/rtl';
```

### 2.4 Mobile Testing Checklist

```
[ ] Login flow works
[ ] Location permissions granted
[ ] Map loads with markers
[ ] Tapping marker shows callout
[ ] Sale list displays correctly
[ ] Sale detail page works
[ ] Bookmark add/remove works
[ ] Hebrew/English toggle works
[ ] RTL layout correct for Hebrew
[ ] Share to WhatsApp works
[ ] Images load (or show placeholder)
```

---

## PHASE 3: WEB DASHBOARD FIXES

### 3.1 Known Issues

| Issue | Page | Priority |
|-------|------|----------|
| Store creation failing | /dashboard/store | HIGH |
| Sales creation issues | /dashboard/sales/new | HIGH |
| Dashboard error for non-store users | /dashboard | FIXED |

### 3.2 Pages to Audit

```
1. [ ] /dashboard - Main dashboard (FIXED for non-store users)
2. [ ] /dashboard/store - Store creation/editing
3. [ ] /dashboard/sales - Sales listing
4. [ ] /dashboard/sales/new - Create new sale
5. [ ] /dashboard/sales/[id] - Edit sale
6. [ ] /login - Authentication
7. [ ] /register - User registration
```

### 3.3 Store Creation Flow

**Current Issue:** Store creation may be failing silently or with errors.

**Investigation:**
```
1. Check storesService.create() API call
2. Verify backend /api/stores POST endpoint
3. Check required fields match form
4. Test with backend logs enabled
```

### 3.4 Sales Creation Flow

**Current Issue:** Sales may not be saving correctly.

**Investigation:**
```
1. Verify form fields match CreateSaleDto
2. Check image upload integration
3. Verify date format matches backend expectations
4. Test API response handling
```

---

## PHASE 4: SECURITY HARDENING

### 4.1 Environment Variables Audit

**Backend (.env) - Check these are set:**
```env
JWT_SECRET=<random-32-char-string>      # CHANGE IN PRODUCTION
JWT_REFRESH_SECRET=<different-string>   # CHANGE IN PRODUCTION
DATABASE_PASSWORD=<strong-password>     # CHANGE IN PRODUCTION
NODE_ENV=production                     # MUST BE SET
```

### 4.2 Security Checklist

```
[ ] JWT secrets are unique and strong (32+ chars)
[ ] Database password is strong
[ ] CORS origins restricted to known domains
[ ] Rate limiting enabled on auth endpoints
[ ] Input validation on all DTOs
[ ] SQL injection prevented (TypeORM handles this)
[ ] XSS prevention (React handles this)
[ ] HTTPS enforced in production
[ ] Error messages don't leak stack traces
```

### 4.3 Password Security

**Current Status:** bcrypt hashing implemented ✅

**Verification:**
```typescript
// In users.service.ts - password is hashed before save
const hashedPassword = await bcrypt.hash(password, 10);
```

---

## PHASE 5: TESTING STRATEGY

### 5.1 Backend Tests

**Current Coverage:**
- ✅ auth.service.spec.ts - 8 tests
- ✅ users.service.spec.ts - 6 tests  
- ✅ sales.service.spec.ts - 8 tests
- ✅ bookmarks.service.spec.ts - 6 tests

**Tests to Add:**
```
[ ] stores.service.spec.ts - Store CRUD
[ ] notifications.service.spec.ts - Push notifications
[ ] Integration tests - API endpoints
[ ] E2E tests - Full user flows
```

### 5.2 Manual Testing Protocol

**Test Script:**
```powershell
# 1. Start backend
cd backend
npm run start:dev

# 2. Seed database
curl -X POST http://localhost:3000/api/seed

# 3. Test auth
$body = '{"email":"test@mysellguid.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
$token = $response.access_token

# 4. Test nearby sales
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/sales/nearby?lat=32.15&lng=34.91&radius=5000" -Headers $headers

# 5. Check images array is [] not null
```

---

## PHASE 6: DEPLOYMENT PREPARATION

### 6.1 Backend Deployment (Railway/Render)

**Environment Variables Required:**
```
DATABASE_URL=postgresql://user:pass@host:5432/mysellguid
REDIS_URL=redis://host:6379
JWT_SECRET=<production-secret>
JWT_REFRESH_SECRET=<production-secret>
NODE_ENV=production
CORS_ORIGINS=https://mysellguid.com,https://app.mysellguid.com
```

### 6.2 Web Deployment (Vercel)

**Required:**
```
NEXT_PUBLIC_API_URL=https://api.mysellguid.com/api
```

### 6.3 Mobile Deployment (EAS Build)

**Steps:**
```
1. [ ] Update app.json with production API URL
2. [ ] Configure EAS build
3. [ ] Build for Android: eas build --platform android
4. [ ] Build for iOS: eas build --platform ios
5. [ ] Submit to stores
```

---

## IMPLEMENTATION ORDER

### Week 1: Critical Fixes
| Day | Task | Est. Time |
|-----|------|-----------|
| 1 | Fix web lint errors (17 errors) | 2-3 hours |
| 1 | Verify image array fix | 30 min |
| 2 | Audit mobile DiscoverScreen | 2 hours |
| 2 | Fix mobile image loading | 1 hour |
| 3 | Test store creation flow (web) | 2 hours |
| 3 | Test sales creation flow (web) | 2 hours |
| 4 | Full E2E testing mobile | 3 hours |
| 5 | Full E2E testing web | 3 hours |

### Week 2: Polish & Deploy
| Day | Task | Est. Time |
|-----|------|-----------|
| 1 | Security audit | 2 hours |
| 1 | Environment variables check | 1 hour |
| 2 | Add missing tests | 3 hours |
| 3 | Deploy backend to staging | 2 hours |
| 3 | Deploy web to staging | 1 hour |
| 4 | Full staging E2E test | 3 hours |
| 5 | Production deploy | 2 hours |

---

## QUICK START - WHAT TO DO NOW

### Immediate Actions (Today)

1. **Fix web lint errors:**
   ```powershell
   cd web
   # I'll fix these files for you
   ```

2. **Test the image fix:**
   ```powershell
   cd backend
   npm run start:dev
   # Then test nearby sales API
   ```

3. **Verify mobile works:**
   ```powershell
   cd mobile
   npx expo start
   # Test on device
   ```

---

## READY TO START?

Tell me which to tackle first:
1. **Fix web lint errors** - Get web building
2. **Test mobile screens** - Find and fix design issues
3. **Test store/sales creation** - Debug the flows
4. **All of the above** - Systematic walkthrough

I'll execute whichever you choose.

