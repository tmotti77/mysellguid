# MySellGuid Quick Start Guide

## Local Development (5 minutes)

### Prerequisites
- Node.js 18+
- Docker Desktop
- Git

### 1. Clone and Start Infrastructure
```bash
git clone https://github.com/tmotti77/mysellguid.git
cd mysellguid

# Start PostgreSQL + Redis
cd infrastructure/docker
docker-compose up -d
cd ../..
```

### 2. Start Backend
```bash
cd backend
npm install
npm run start:dev
```

Backend running at: http://localhost:3000/api
Swagger docs at: http://localhost:3000/api/docs

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

Scan QR code with Expo Go app.

### 5. Test Login
- **Email**: test@mysellguid.com
- **Password**: password123

---

## Quick API Test

```bash
# Health check
curl http://localhost:3000/api/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@mysellguid.com","password":"password123"}'

# Get nearby sales (Ramat Gan, Israel)
curl "http://localhost:3000/api/sales/nearby?lat=32.1544678&lng=34.9167442&radius=5000"
```

---

## Project Structure

```
mysellguid/
├── backend/           # NestJS API (Port 3000)
├── mobile/            # React Native + Expo
├── web/               # Next.js dashboard
├── infrastructure/    # Docker files
└── docs/              # Documentation
```

---

## Common Commands

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run start:dev` |
| Start mobile | `cd mobile && npx expo start` |
| Start web | `cd web && npm run dev` |
| Run tests | `cd backend && npm test` |
| Build backend | `cd backend && npm run build` |
| Build mobile APK | `cd mobile && eas build --platform android` |

---

## Useful Links

- [Architecture](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Crowdsourcing Feature](./features/crowdsourcing.md)
