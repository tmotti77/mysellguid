# MySellGuid Deployment Guide

## Current Production Deployment

- **Backend**: https://mysellguid-api.onrender.com
- **Mobile**: Expo Go / EAS Build
- **Repository**: https://github.com/tmotti77/mysellguid

---

## Backend Deployment (Render.com)

### Prerequisites
1. Render.com account
2. GitHub repository connected

### Environment Variables (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `JWT_SECRET` | 64-char random string | Generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | 64-char random string | Different from JWT_SECRET |
| `SEED_SECRET` | 32-char random string | For /api/seed endpoint |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `10000` (Render default) |
| `GOOGLE_GEMINI_API_KEY` | For AI image analysis | - |
| `SENTRY_DSN` | Error tracking | - |

### Deployment Steps

1. **Create PostgreSQL Database on Render**
   - Create new PostgreSQL instance
   - Copy Internal Database URL

2. **Enable PostGIS Extension**
   ```sql
   -- Connect to database shell and run:
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

3. **Create Redis Instance on Render**
   - Create new Redis instance
   - Copy Internal URL

4. **Create Web Service**
   - Connect to GitHub repository
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start:prod`

5. **Add Environment Variables**
   - Add all required variables from table above

6. **Initial Database Sync**
   - Set `SYNC_DATABASE=true` temporarily
   - Deploy
   - After tables created, remove `SYNC_DATABASE`

7. **Seed Database**
   ```bash
   curl -X POST "https://mysellguid-api.onrender.com/api/seed?secret=YOUR_SEED_SECRET"
   ```

8. **Verify Deployment**
   ```bash
   curl https://mysellguid-api.onrender.com/api/health
   ```

---

## Mobile App Deployment (EAS Build)

### Prerequisites
1. Expo account
2. EAS CLI installed: `npm install -g eas-cli`
3. EAS project configured

### Configuration

Update `mobile/app.json`:
```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://mysellguid-api.onrender.com/api"
    }
  }
}
```

### Build Commands

**Development Build:**
```bash
cd mobile
eas build --platform android --profile development
eas build --platform ios --profile development
```

**Production Build:**
```bash
cd mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

### Submit to App Stores

**Android (Google Play):**
```bash
eas submit --platform android
```

**iOS (App Store):**
```bash
eas submit --platform ios
```

---

## Web Dashboard Deployment (Vercel)

### Prerequisites
1. Vercel account
2. GitHub repository connected

### Configuration

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=https://mysellguid-api.onrender.com/api
```

### Deployment Steps

1. **Connect Repository to Vercel**
   - Import from GitHub
   - Root Directory: `web`
   - Framework: Next.js

2. **Add Environment Variables**
   - `NEXT_PUBLIC_API_URL`

3. **Deploy**
   - Push to main branch triggers deploy

---

## Local Development Setup

### 1. Start Infrastructure (Docker)
```bash
cd infrastructure/docker
docker-compose up -d
```

### 2. Start Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with local settings
npm run start:dev
```

### 3. Seed Database
```bash
curl -X POST "http://localhost:3000/api/seed?secret=92c6d9f4bfe9e54e1dd622b0ad13c42c"
```

### 4. Start Mobile App
```bash
cd mobile
npm install --legacy-peer-deps
npx expo start
```

### 5. Start Web Dashboard
```bash
cd web
npm install
npm run dev
```

---

## CI/CD Pipeline (GitHub Actions)

### Backend CI

Create `.github/workflows/backend.yml`:
```yaml
name: Backend CI

on:
  push:
    branches: [main, master]
    paths:
      - 'backend/**'
  pull_request:
    branches: [main, master]
    paths:
      - 'backend/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: cd backend && npm ci
      - run: cd backend && npm run lint
      - run: cd backend && npm test
      - run: cd backend && npm run build
```

---

## Monitoring & Logging

### Sentry (Error Tracking)

**Backend:**
```bash
npm install @sentry/node
```

**Mobile:**
```bash
npm install @sentry/react-native --legacy-peer-deps
```

### Health Checks

- Backend: `GET /api/health`
- Render auto-monitors and restarts on failure

---

## Rollback Procedures

### Backend (Render)
1. Go to Render Dashboard
2. Select Web Service
3. Go to "Deploys" tab
4. Click "Rollback" on previous successful deploy

### Mobile
1. Revert git commit
2. Build new version with EAS
3. Submit to app stores

---

## Scaling Considerations

### Backend
- Render auto-scales with instance size upgrade
- Add Redis for caching frequent queries
- Use Bull queues for async operations

### Database
- Enable connection pooling (PgBouncer on Render)
- Add read replicas for heavy read workloads
- Regular VACUUM and ANALYZE

### CDN
- Use Cloudflare R2 for image storage
- Enable caching headers on static assets
