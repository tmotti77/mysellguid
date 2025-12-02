# MySellGuid Backend API

NestJS-based backend for MySellGuid - Local sales discovery platform with geospatial search.

## Features

- ✅ **Authentication** - JWT with refresh tokens
- ✅ **Geospatial Search** - PostGIS powered nearby sales
- ✅ **Image Upload** - AWS S3 integration
- ✅ **Push Notifications** - Firebase Cloud Messaging
- ✅ **Background Jobs** - Bull queue with Redis
- ✅ **Rate Limiting** - Throttler protection
- ✅ **Social Scraping** - Instagram/Facebook via Apify (optional)
- ✅ **AI Features** - OpenAI integration (optional)

## Tech Stack

- **Framework**: NestJS + TypeScript
- **Database**: PostgreSQL 15 + PostGIS 3.3
- **Cache**: Redis 7
- **Queue**: Bull
- **ORM**: TypeORM
- **Validation**: class-validator

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ with PostGIS
- Redis 7+
- Docker Desktop (recommended)

## Quick Start

### 1. Install Dependencies

```powershell
npm install
```

### 2. Start Database with Docker

```powershell
cd ..\infrastructure\docker
docker-compose up -d
```

This starts:
- PostgreSQL 15 with PostGIS on port 5432
- Redis 7 on port 6379
- pgAdmin on port 5050

### 3. Configure Environment

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=mysellguid

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
```

### 4. Run Migrations

```powershell
npm run migration:run
```

### 5. Seed Database (Optional)

```powershell
# Start server first
npm run start:dev

# Then seed in another terminal
curl -X POST http://localhost:3000/api/seed
```

### 6. Start Development Server

```powershell
npm run start:dev
```

API runs on http://localhost:3000

## API Endpoints

### Health Check
```
GET /health          - Health status
GET /health/ready    - Readiness probe
GET /health/live     - Liveness probe
```

### Authentication
```
POST /api/auth/register  - Register new user
POST /api/auth/login     - Login
POST /api/auth/refresh   - Refresh token
POST /api/auth/logout    - Logout
```

### Sales
```
GET    /api/sales              - Get all sales
GET    /api/sales/:id          - Get sale by ID
GET    /api/sales/nearby       - Geospatial search
GET    /api/sales/store/:id    - Get sales by store
GET    /api/sales/search       - Text search
POST   /api/sales              - Create sale (auth)
PATCH  /api/sales/:id          - Update sale (auth)
DELETE /api/sales/:id          - Delete sale (auth)
POST   /api/sales/:id/share    - Track share
```

### Stores
```
GET    /api/stores              - Get all stores
GET    /api/stores/:id          - Get store by ID
GET    /api/stores/nearby       - Find nearby stores
GET    /api/stores/my-store     - Get my store (auth)
POST   /api/stores              - Create store (auth)
PATCH  /api/stores/:id          - Update store (auth)
```

### Bookmarks
```
GET    /api/bookmarks           - Get my bookmarks (auth)
POST   /api/bookmarks/:saleId   - Add bookmark (auth)
DELETE /api/bookmarks/:saleId   - Remove bookmark (auth)
GET    /api/bookmarks/check/:saleId - Check if bookmarked (auth)
```

### Upload
```
POST /api/upload/image  - Upload image to S3 (auth)
```

## Testing

```powershell
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Database Commands

```powershell
# Generate migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert

# Show migrations status
npm run migration:show
```

## Production Build

```powershell
npm run build
npm run start:prod
```

## Deployment

See [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) for detailed deployment instructions.

**Quick Deploy to Railway:**
```powershell
npm install -g @railway/cli
railway login
railway init
railway up
```

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_HOST` | PostgreSQL host | Yes | - |
| `DATABASE_PORT` | PostgreSQL port | Yes | 5432 |
| `DATABASE_USER` | Database user | Yes | - |
| `DATABASE_PASSWORD` | Database password | Yes | - |
| `DATABASE_NAME` | Database name | Yes | - |
| `REDIS_HOST` | Redis host | Yes | - |
| `REDIS_PORT` | Redis port | Yes | 6379 |
| `REDIS_PASSWORD` | Redis password | No | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `JWT_REFRESH_SECRET` | Refresh token secret | Yes | - |
| `JWT_EXPIRES_IN` | Access token expiry | No | 15m |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | No | 30d |
| `AWS_ACCESS_KEY_ID` | AWS access key | For uploads | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | For uploads | - |
| `AWS_S3_BUCKET` | S3 bucket name | For uploads | - |
| `AWS_REGION` | AWS region | For uploads | us-east-1 |
| `FIREBASE_PROJECT_ID` | Firebase project | For notifications | - |
| `FIREBASE_PRIVATE_KEY` | Firebase private key | For notifications | - |
| `FIREBASE_CLIENT_EMAIL` | Firebase client email | For notifications | - |
| `APIFY_TOKEN` | Apify API token | For scraping | - |
| `OPENAI_API_KEY` | OpenAI API key | For AI features | - |
| `NODE_ENV` | Environment | No | development |
| `PORT` | Server port | No | 3000 |

## Architecture

```
src/
├── config/              # Configuration files
├── modules/
│   ├── auth/           # Authentication (JWT)
│   ├── users/          # User management
│   ├── stores/         # Store management
│   ├── sales/          # Sales CRUD + geospatial
│   ├── bookmarks/      # User bookmarks
│   ├── notifications/  # Push notifications
│   ├── upload/         # Image upload (S3)
│   ├── scraping/       # Social media scraping
│   ├── ml/             # AI/ML features
│   └── firebase/       # Firebase integration
├── seed/               # Database seeding
├── migrations/         # TypeORM migrations
├── health.controller.ts # Health check endpoint
└── main.ts             # Application entry
```

## Security

- JWT authentication with refresh tokens
- Rate limiting (100 req/min per IP)
- CORS enabled for configured origins
- Helmet security headers
- Password hashing with bcrypt
- SQL injection protection via TypeORM
- Input validation with class-validator

## Performance

- Connection pooling
- Redis caching
- Query optimization with indexes
- PostGIS spatial indexes
- Background job processing
- Pagination on all list endpoints

## Monitoring

Health check endpoints for:
- Kubernetes/Docker readiness probes
- Liveness probes
- Database connectivity
- Memory usage
- Uptime tracking

## Support

- Documentation: [Full docs](../README.md)
- Issues: [GitHub Issues](https://github.com/tmotti77/mysellguid/issues)
- Deployment: [Deployment Guide](../DEPLOYMENT_GUIDE.md)

## License

MIT

