# MySellGuid API Documentation

## Base URL
- **Production**: `https://mysellguid-api.onrender.com/api`
- **Local Development**: `http://localhost:3000/api`
- **Swagger UI**: `{base_url}/docs`

## Authentication

All protected endpoints require a Bearer token:
```
Authorization: Bearer {access_token}
```

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user"
}
```

**Response (201):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "user": { ... },
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Headers:**
```
Authorization: Bearer {refresh_token}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG..."
}
```

---

## Sales

### GET /sales/nearby
Get sales within a radius of a location.

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| lat | number | Yes | - | Latitude |
| lng | number | Yes | - | Longitude |
| radius | number | No | 5000 | Radius in meters |
| category | string | No | - | Filter by category |
| minDiscount | number | No | - | Minimum discount % |
| limit | number | No | 50 | Max results |
| offset | number | No | 0 | Skip results |

**Example:**
```
GET /sales/nearby?lat=32.0853&lng=34.7818&radius=5000&category=clothing
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "title": "50% OFF Summer Collection",
    "description": "All summer items half price",
    "category": "clothing",
    "discountPercentage": 50,
    "originalPrice": 299.99,
    "salePrice": 149.99,
    "currency": "ILS",
    "startDate": "2025-01-01T00:00:00Z",
    "endDate": "2025-01-31T23:59:59Z",
    "status": "active",
    "images": ["https://..."],
    "latitude": 32.0853,
    "longitude": 34.7818,
    "distance": 1234.56,
    "store": {
      "id": "uuid",
      "name": "Fashion Paradise",
      "category": "fashion",
      "logo": "https://...",
      "address": "123 Main St",
      "city": "Tel Aviv"
    }
  }
]
```

### GET /sales/:id
Get sale details by ID.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "50% OFF Summer Collection",
  "description": "Full description...",
  "category": "clothing",
  "discountPercentage": 50,
  "originalPrice": 299.99,
  "salePrice": 149.99,
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z",
  "images": ["https://..."],
  "store": { ... },
  "views": 1234,
  "clicks": 567
}
```

### POST /sales
Create a new sale. **Requires authentication (store owner)**.

**Request:**
```json
{
  "title": "New Sale",
  "description": "Sale description",
  "category": "clothing",
  "discountPercentage": 30,
  "originalPrice": 100,
  "salePrice": 70,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "images": ["https://..."],
  "storeId": "uuid"
}
```

### GET /sales/search
Search sales by keyword.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query |
| category | string | No | Filter by category |
| minDiscount | number | No | Minimum discount % |
| limit | number | No | Max results |

---

## Stores

### GET /stores/:id
Get store details by ID.

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Fashion Paradise",
  "description": "Premium clothing store",
  "category": "fashion",
  "address": "123 Main St",
  "city": "Tel Aviv",
  "country": "Israel",
  "latitude": 32.0853,
  "longitude": 34.7818,
  "phoneNumber": "+972-3-1234567",
  "email": "info@store.com",
  "logo": "https://...",
  "coverImage": "https://...",
  "isVerified": true,
  "rating": 4.5,
  "reviewCount": 124
}
```

### GET /stores/my-store
Get current user's store. **Requires authentication (store owner)**.

### POST /stores
Create a new store. **Requires authentication**.

---

## Bookmarks

### GET /bookmarks
Get user's bookmarked sales. **Requires authentication**.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| lat | number | No | Latitude (for distance) |
| lng | number | No | Longitude (for distance) |

### POST /bookmarks/:saleId
Add sale to bookmarks. **Requires authentication**.

### DELETE /bookmarks/:saleId
Remove sale from bookmarks. **Requires authentication**.

### GET /bookmarks/check/:saleId
Check if sale is bookmarked. **Requires authentication**.

**Response (200):**
```json
{
  "isBookmarked": true
}
```

---

## Users

### GET /users/me
Get current user profile. **Requires authentication**.

### PATCH /users/me
Update user profile. **Requires authentication**.

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+972501234567"
}
```

### PATCH /users/me/preferences
Update user preferences. **Requires authentication**.

**Request:**
```json
{
  "categories": ["clothing", "electronics"],
  "brands": ["Nike", "Apple"],
  "minDiscount": 20,
  "maxDistance": 10000,
  "notificationEnabled": true,
  "language": "he"
}
```

### PATCH /users/me/location
Update default location. **Requires authentication**.

**Request:**
```json
{
  "latitude": 32.0853,
  "longitude": 34.7818
}
```

---

## Upload

### POST /upload/image
Upload a single image. **Requires authentication**.

**Request:** multipart/form-data
- `image`: Image file (max 5MB, JPG/PNG/GIF/WEBP)

**Response (201):**
```json
{
  "url": "https://.../image.jpg",
  "thumbnail": "https://.../thumb.jpg",
  "medium": "https://.../medium.jpg"
}
```

---

## Health

### GET /health
Check API health status.

**Response (200):**
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2025-01-15T12:00:00Z"
}
```

---

## Error Codes

| Status | Description |
|--------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- **Limit**: 100 requests per minute per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## Categories

Valid category values:
- `clothing`
- `fashion`
- `shoes`
- `accessories`
- `electronics`
- `home`
- `home_goods`
- `furniture`
- `beauty`
- `sports`
- `food`
- `other`
