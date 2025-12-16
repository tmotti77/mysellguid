# MySellGuid Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTS                                        │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   Mobile App    │     │  Web Dashboard   │     │   Store App     │   │
│  │ (React Native)  │     │    (Next.js)     │     │   (Future)      │   │
│  └────────┬────────┘     └────────┬────────┘     └────────┬────────┘   │
│           │                       │                       │             │
└───────────┼───────────────────────┼───────────────────────┼─────────────┘
            │                       │                       │
            ▼                       ▼                       ▼
     ┌──────────────────────────────────────────────────────────┐
     │                    API GATEWAY                            │
     │               https://mysellguid-api.onrender.com        │
     └──────────────────────────┬───────────────────────────────┘
                                │
                                ▼
     ┌──────────────────────────────────────────────────────────┐
     │                   BACKEND (NestJS)                        │
     │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
     │  │   Auth   │  │  Sales   │  │  Stores  │  │  Users   │ │
     │  │  Module  │  │  Module  │  │  Module  │  │  Module  │ │
     │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
     │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
     │  │ Bookmarks│  │  Upload  │  │   ML/AI  │  │  Notify  │ │
     │  │  Module  │  │  Module  │  │  Module  │  │  Module  │ │
     │  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
     └──────────────────────────┬───────────────────────────────┘
                                │
            ┌───────────────────┼───────────────────┐
            ▼                   ▼                   ▼
     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
     │ PostgreSQL  │     │    Redis    │     │   Gemini    │
     │  + PostGIS  │     │   (Cache)   │     │    API      │
     │  (Database) │     │   (Queue)   │     │    (AI)     │
     └─────────────┘     └─────────────┘     └─────────────┘
```

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Backend** | NestJS | 10.3.x | REST API framework |
| **Database** | PostgreSQL | 15.x | Primary data store |
| **Geospatial** | PostGIS | 3.3 | Location-based queries |
| **ORM** | TypeORM | 0.3.17 | Database abstraction |
| **Cache/Queue** | Redis + Bull | 7.x / 4.12.x | Caching & job queues |
| **Mobile** | React Native | 0.81.5 | iOS & Android app |
| **Mobile SDK** | Expo | 54.x | Build & deployment |
| **Web** | Next.js | 16.x | Admin dashboard |
| **Styling** | Tailwind CSS | 4.x | Web UI |
| **Auth** | Passport + JWT | Latest | Authentication |
| **AI** | Google Gemini | 1.5 | Image analysis |

## Data Flow

### User Discovery Flow
```
User opens app
     │
     ▼
Request location permission
     │
     ▼
GET /api/sales/nearby?lat=X&lng=Y&radius=5000
     │
     ▼
PostGIS calculates distance using ST_DWithin
     │
     ▼
Return sales sorted by distance with store info
     │
     ▼
Display on map + list view
```

### User Report Flow (Crowdsourcing)
```
User spots sale in store
     │
     ▼
Taps "Report Sale" → Camera opens
     │
     ▼
Takes photo → POST /api/user-reports (image)
     │
     ▼
Gemini Vision API analyzes image
     │
     ▼
Extracts: title, discount, price, category
     │
     ▼
User confirms/edits → Submit
     │
     ▼
If trusted user → auto-approve
If new user → queue for moderation
     │
     ▼
User earns points → Update leaderboard
```

### Authentication Flow
```
User submits email/password
     │
     ▼
POST /api/auth/login
     │
     ▼
Validate credentials (bcrypt)
     │
     ▼
Generate JWT access token (15min)
Generate JWT refresh token (7d)
     │
     ▼
Store refresh token hash in DB
     │
     ▼
Return tokens to client
     │
     ▼
Client stores in AsyncStorage/localStorage
     │
     ▼
Subsequent requests include Bearer token
     │
     ▼
On 401 → Use refresh token to get new access token
```

## Database Schema

### Core Tables

```sql
-- Users table
users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password VARCHAR,
  firstName VARCHAR,
  lastName VARCHAR,
  role ENUM('user', 'store_owner', 'admin'),
  preferences JSONB,
  defaultLatitude DECIMAL,
  defaultLongitude DECIMAL,
  fcmToken VARCHAR,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)

-- Stores table
stores (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  category ENUM,
  address VARCHAR,
  city VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  location GEOGRAPHY(POINT),
  logo VARCHAR,
  coverImage VARCHAR,
  ownerId UUID REFERENCES users(id),
  isVerified BOOLEAN,
  rating DECIMAL,
  createdAt TIMESTAMP
)

-- Sales table
sales (
  id UUID PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  category ENUM,
  discountPercentage INTEGER,
  originalPrice DECIMAL,
  salePrice DECIMAL,
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  status ENUM('active', 'expired', 'pending'),
  images TEXT[],
  storeId UUID REFERENCES stores(id),
  latitude DECIMAL,
  longitude DECIMAL,
  location GEOGRAPHY(POINT),
  source ENUM('manual', 'scraping', 'user_report', 'api'),
  views INTEGER,
  clicks INTEGER,
  createdAt TIMESTAMP
)

-- Bookmarks table
bookmarks (
  userId UUID REFERENCES users(id),
  saleId UUID REFERENCES sales(id),
  createdAt TIMESTAMP,
  PRIMARY KEY (userId, saleId)
)
```

### Indexes

```sql
-- Geospatial indexes for fast nearby queries
CREATE INDEX idx_sales_location ON sales USING GIST (location);
CREATE INDEX idx_stores_location ON stores USING GIST (location);

-- Performance indexes
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_category ON sales(category);
CREATE INDEX idx_sales_dates ON sales(startDate, endDate);
CREATE INDEX idx_bookmarks_user ON bookmarks(userId);
```

## API Architecture

### Base URL
- Production: `https://mysellguid-api.onrender.com/api`
- Local: `http://localhost:3000/api`

### Authentication
All protected endpoints require:
```
Authorization: Bearer {access_token}
```

### Rate Limiting
- 100 requests per minute per IP
- Configurable in `app.module.ts`

### Response Format
```json
{
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 100
  }
}
```

### Error Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Security Measures

1. **Authentication**: JWT with access + refresh tokens
2. **Authorization**: Role-based guards (User, Store Owner, Admin)
3. **Password**: bcrypt hashing (10 rounds)
4. **Input Validation**: class-validator on all DTOs
5. **SQL Injection**: TypeORM parameterized queries
6. **XSS Prevention**: React auto-escaping
7. **Rate Limiting**: 100 req/min per IP
8. **CORS**: Restricted to known domains in production
9. **HTTPS**: Enforced in production

## Scalability Considerations

1. **Database**: Read replicas for scaling reads
2. **Caching**: Redis for hot data (nearby sales, user prefs)
3. **Queue**: Bull for async jobs (notifications, AI analysis)
4. **CDN**: Cloudflare R2 for images (no egress fees)
5. **Background Jobs**: Separate workers for heavy processing
6. **Monitoring**: Sentry for errors, custom metrics

## File Structure

```
mysellguid/
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # JWT authentication
│   │   │   ├── users/        # User management
│   │   │   ├── stores/       # Store CRUD
│   │   │   ├── sales/        # Sales + geospatial
│   │   │   ├── bookmarks/    # Save favorites
│   │   │   ├── upload/       # Image upload
│   │   │   ├── ml/           # AI/Gemini
│   │   │   └── notifications/# Push notifications
│   │   ├── seed/             # Database seeding
│   │   ├── config/           # TypeORM, env config
│   │   └── main.ts
│   └── package.json
├── mobile/
│   ├── src/
│   │   ├── screens/          # React Native screens
│   │   ├── components/       # Reusable components
│   │   ├── navigation/       # React Navigation
│   │   ├── services/         # API client
│   │   ├── context/          # Auth, i18n contexts
│   │   ├── hooks/            # Custom hooks
│   │   └── i18n/             # Translations
│   ├── app.json              # Expo config
│   └── package.json
├── web/
│   ├── src/
│   │   ├── app/              # Next.js app router
│   │   ├── components/       # React components
│   │   ├── services/         # API client
│   │   └── context/          # Auth context
│   └── package.json
├── infrastructure/
│   └── docker/               # Docker Compose
└── docs/                     # Documentation
```
