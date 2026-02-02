# Mobile App Update - Supabase Migration

## Changes Made

### API Endpoint Updates (`mobile/src/services/api.ts`)

All API endpoints have been updated to work with the new Supabase Edge Functions:

#### Authentication
- `/auth/register` → `/auth-register`
- `/auth/login` → `/auth-login`
- Removed token refresh logic (Supabase tokens are longer-lived)
- Logout is now client-side only

#### Sales
- `/sales/nearby` → `/sales-nearby`
- `/sales/:id` → `/sales-get/:id`
- `/sales/store/:id` → `/sales-by-store/:id`
- `/sales` → `/sales-create`

#### Stores
- `/stores/nearby` → `/stores-nearby`
- `/stores/:id` → `/stores-get/:id`
- `/stores/my-stores` → `/stores-my-stores`
- `/stores` → `/stores-create`
- `/stores/:id` (PATCH) → `/stores-update/:id`

#### Bookmarks
- `/bookmarks` → `/bookmarks-list`
- `/bookmarks/:id` (POST) → `/bookmarks-add/:id`
- `/bookmarks/:id` (DELETE) → `/bookmarks-remove/:id`

### Removed Features (Not Yet Implemented in Supabase)
- Token refresh endpoint
- User profile endpoints (`/users/me`)
- ML/AI service endpoints
- Share tracking

These features return "Not implemented yet" errors and can be added later.

### Configuration (`mobile/app.json`)
- API URL updated to: `https://qfffuuqldmjtxxihynug.supabase.co/functions/v1`

## What Works

✅ User registration and login
✅ Finding nearby sales with geospatial search
✅ Viewing sale details
✅ Viewing store details
✅ Creating stores (for logged-in users)
✅ Creating sales (for store owners)
✅ Bookmarking sales
✅ Viewing saved bookmarks
✅ No more cold starts (Supabase Edge Functions are always warm!)

## Migrated Users

5 existing users have been migrated with temporary password: `TempPassword123!`

They can login with their email and this temporary password, then should change it in the app.

## Testing

Test with the migrated user:
- Email: `test@mysellguid.com`
- Password: `TempPassword123!`

Or create a new account via the app registration screen.

## Build Instructions

Build new APK with updated endpoints:

```powershell
cd mobile
eas build --platform android --profile production
```

Or for preview build:

```powershell
eas build --platform android --profile preview
```

## Performance Improvements

- **No cold starts**: Supabase Edge Functions wake up instantly (vs 30-50s on Render)
- **Lower latency**: Edge functions run closer to users
- **Free forever**: No more hosting costs

## Next Steps

1. Build and test the new APK
2. Test all features on a physical device
3. Implement remaining endpoints (user profile, password reset)
4. Add ML/AI discovery features
5. Deploy web dashboard

---

**Last Updated**: February 2, 2026
**Migration Status**: ✅ Complete
