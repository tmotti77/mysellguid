# MySellGuid API - Complete Endpoint Reference

## Base URL
```
https://qfffuuqldmjtxxihynug.supabase.co/functions/v1
```

**Status**: ✅ All 24 endpoints deployed and operational (February 4, 2026)

---

## 🔐 Authentication (4 endpoints)

### POST /auth-register
Create a new user account.
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/auth-register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Response
{
  "accessToken": "eyJ...",
  "refreshToken": "...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### POST /auth-login
Login with email and password.
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/auth-login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@mysellguid.com", "password": "TempPassword123!"}'
```

### GET/PATCH /auth-update-profile
Get or update user profile. Requires auth token.
```bash
# Get profile
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/auth-update-profile \
  -H "Authorization: Bearer {accessToken}"

# Update profile
curl -X PATCH https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/auth-update-profile \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Jane"}'
```

### POST /auth-reset-password
Request password reset or execute reset with token.
```bash
# Request reset email
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/auth-reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## 📍 Sales (8 endpoints)

### GET /sales-nearby
Find sales near a location using PostGIS geospatial search.
```bash
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-nearby?lat=32.0853&lng=34.7818&radius=5000"

# Query Parameters:
# - lat (required): Latitude
# - lng (required): Longitude
# - radius (optional): Search radius in meters (default: 5000)
# - category (optional): Filter by category
# - minDiscount (optional): Minimum discount percentage
# - limit (optional): Max results (default: 50)
# - offset (optional): Pagination offset
```

### GET /sales-search
Search sales by keyword with location-based ranking.
```bash
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-search?q=dress&lat=32.08&lng=34.78"

# Query Parameters:
# - q (required): Search query
# - lat (optional): Latitude for distance calculation
# - lng (optional): Longitude for distance calculation
# - limit (optional): Max results (default: 20)
```

### GET /sales-get/{id}
Get sale details by ID.
```bash
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-get/uuid-here
```

### GET /sales-by-store/{storeId}
Get all sales for a specific store.
```bash
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-by-store/store-uuid?limit=50"
```

### POST /sales-create
Create a new sale. Requires auth.
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-create \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "50% Off Sale",
    "description": "Amazing deals!",
    "category": "clothing",
    "discountPercentage": 50,
    "originalPrice": 200,
    "salePrice": 100,
    "storeId": "store-uuid",
    "latitude": 32.0853,
    "longitude": 34.7818
  }'
```

### PATCH /sales-update/{id}
Update a sale. Requires auth (owner only).
```bash
curl -X PATCH https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-update/sale-uuid \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"discountPercentage": 60}'
```

### DELETE /sales-delete/{id}
Delete a sale. Requires auth (owner only).
```bash
curl -X DELETE https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-delete/sale-uuid \
  -H "Authorization: Bearer {accessToken}"
```

### POST /sales-report
Report a community-discovered sale (no auth required).
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/sales-report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Great sale at local store",
    "category": "clothing",
    "latitude": 32.08,
    "longitude": 34.78,
    "storeName": "Fashion Store",
    "discountPercentage": 30,
    "description": "Found this amazing deal!"
  }'
```

---

## 🏪 Stores (5 endpoints)

### GET /stores-nearby
Find stores near a location.
```bash
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/stores-nearby?lat=32.0853&lng=34.7818&radius=5000"
```

### GET /stores-get/{id}
Get store details by ID.
```bash
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/stores-get/store-uuid
```

### POST /stores-create
Create a new store. Requires auth.
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/stores-create \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Store",
    "category": "clothing",
    "address": "123 Main St",
    "city": "Tel Aviv",
    "latitude": 32.0853,
    "longitude": 34.7818
  }'
```

### PATCH /stores-update/{id}
Update a store. Requires auth (owner only).
```bash
curl -X PATCH https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/stores-update/store-uuid \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Store Name"}'
```

### GET /stores-my-stores
Get all stores owned by the authenticated user.
```bash
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/stores-my-stores \
  -H "Authorization: Bearer {accessToken}"
```

---

## 🔖 Bookmarks (3 endpoints)

### GET /bookmarks-list
Get user's bookmarked sales. Requires auth.
```bash
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/bookmarks-list \
  -H "Authorization: Bearer {accessToken}"
```

### POST /bookmarks-add/{saleId}
Bookmark a sale. Requires auth.
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/bookmarks-add/sale-uuid \
  -H "Authorization: Bearer {accessToken}"
```

### DELETE /bookmarks-remove/{saleId}
Remove a bookmark. Requires auth.
```bash
curl -X DELETE https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/bookmarks-remove/sale-uuid \
  -H "Authorization: Bearer {accessToken}"
```

---

## 🤖 AI & Discovery (3 endpoints)

### GET/POST /discovery
Automated sale discovery from RSS feeds and Telegram channels.
```bash
# Get discovery stats
curl "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/discovery?action=stats"

# Run discovery (scrape and publish)
curl -X POST "https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/discovery?action=run"

# Response (stats)
{
  "enabled": true,
  "sources": {
    "rss": ["Slashdot Deals", "DealNews"],
    "telegram": ["DealsIL", "MivtzaimIsrael"]
  },
  "autoPublishThreshold": 0.75,
  "geminiConfigured": true
}
```

### POST /ml-analyze
Analyze sale content using Gemini AI.
```bash
curl -X POST https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/ml-analyze \
  -H "Content-Type: application/json" \
  -d '{
    "title": "50% off all electronics",
    "description": "Big sale on laptops and phones",
    "source": "manual"
  }'
```

---

## 🔧 System (2 endpoints)

### GET /health
Health check endpoint.
```bash
curl https://qfffuuqldmjtxxihynug.supabase.co/functions/v1/health

# Response
{
  "status": "ok",
  "timestamp": "2026-02-04T15:00:00.000Z",
  "database": "connected",
  "uptime": 1234,
  "memory": {"used": 50, "total": 100}
}
```

### GET /migrate-users
One-time user migration (requires MIGRATION_SECRET header).

---

## Categories

Valid category values:
- `clothing`
- `shoes`
- `electronics`
- `home_goods`
- `beauty`
- `sports`
- `food`
- `other`

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request (missing/invalid parameters)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not owner)
- `404` - Not found
- `500` - Server error

---

## Test Credentials

- **Email**: test@mysellguid.com
- **Password**: TempPassword123!

---

**Last Updated**: February 4, 2026
