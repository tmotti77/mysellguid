# MySellGuid - Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

**Why Railway:**
- Free PostgreSQL with PostGIS support
- Auto-deploys from GitHub
- Built-in Redis
- Zero config needed
- Free tier: $5/month credit

**Steps:**

1. **Sign up**: https://railway.app
2. **Install Railway CLI**:
```powershell
npm install -g @railway/cli
railway login
```

3. **Create new project**:
```powershell
cd backend
railway init
```

4. **Add PostgreSQL with PostGIS**:
```powershell
railway add --plugin postgresql
```

5. **Add Redis**:
```powershell
railway add --plugin redis
```

6. **Set environment variables**:
```powershell
railway variables set DATABASE_URL="postgresql://..."
railway variables set REDIS_URL="redis://..."
railway variables set JWT_SECRET="your-secret-here"
railway variables set JWT_REFRESH_SECRET="your-refresh-secret-here"
railway variables set NODE_ENV="production"
```

7. **Deploy**:
```powershell
railway up
```

**Enable PostGIS Extension:**
After first deploy, connect to database:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

### Option 2: Render

**Why Render:**
- Free tier available
- PostgreSQL with PostGIS
- Auto SSL certificates
- GitHub integration

**Steps:**

1. Sign up at https://render.com
2. Create new Web Service from GitHub repo
3. Add PostgreSQL database (select PostGIS version)
4. Add Redis instance
5. Set environment variables in dashboard
6. Deploy automatically on push

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start:prod
```

---

### Option 3: AWS (Production Grade)

**Components:**
- **Compute**: AWS Elastic Beanstalk or ECS
- **Database**: RDS PostgreSQL with PostGIS
- **Cache**: ElastiCache Redis
- **Storage**: S3 for images
- **CDN**: CloudFront

**Estimated Cost**: $30-50/month

---

## Environment Variables

Create a `.env.production` file:

```env
# Database
DATABASE_HOST=your-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-password
DATABASE_NAME=mysellguid
DATABASE_SSL=true

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# AWS S3 (for image uploads)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=mysellguid-uploads
AWS_REGION=eu-west-1

# Apify (for social media scraping - optional)
APIFY_TOKEN=your-apify-token

# OpenAI (for AI features - optional)
OPENAI_API_KEY=your-openai-key

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# App URLs
FRONTEND_URL=https://mysellguid.com
API_URL=https://api.mysellguid.com

# Node
NODE_ENV=production
PORT=3000
```

---

## Database Migration

After deploying, run migrations:

```powershell
# Using Railway
railway run npm run migration:run

# Using SSH
ssh your-server
cd backend
npm run migration:run
```

---

## Post-Deployment Checklist

- [ ] Enable PostGIS extension in database
- [ ] Run database migrations
- [ ] Seed initial data (optional)
- [ ] Test API health endpoint: `/api/health`
- [ ] Configure CORS for mobile app domain
- [ ] Setup monitoring (Sentry recommended)
- [ ] Configure automatic backups
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Test push notifications
- [ ] Verify image upload to S3

---

## Mobile App Configuration

Update `mobile/app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "https://api.mysellguid.com/api"
    }
  }
}
```

---

## Web Dashboard Configuration

Update `web/.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.mysellguid.com/api
```

---

## Domain Setup

### DNS Records:

```
Type    Name              Value                  TTL
A       api               your-server-ip         300
A       @                 your-frontend-ip       300
CNAME   www               mysellguid.com         300
```

---

## Monitoring Setup

### Recommended: Sentry

1. Sign up at https://sentry.io
2. Create new project
3. Install SDK:
```powershell
npm install @sentry/node
```

4. Add to `main.ts`:
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

---

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway link ${{ secrets.RAILWAY_PROJECT_ID }}
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## Scaling Considerations

**When to scale:**
- > 1000 concurrent users
- > 10k sales in database
- Response time > 500ms

**How to scale:**
1. Enable horizontal scaling (multiple instances)
2. Add Redis caching
3. Setup CDN for images
4. Database read replicas
5. Enable query caching

---

## Security Hardening

- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Enable CORS whitelist
- [ ] Setup API key rotation
- [ ] Enable database encryption
- [ ] Regular security audits
- [ ] Implement WAF (CloudFlare recommended)

---

## Cost Estimation

### Startup (Free Tier):
- Railway/Render: $0-5/month
- Domain: $12/year
- Total: ~$5/month

### Growth (1k+ users):
- Server: $25/month
- Database: $25/month
- Redis: $10/month
- S3 Storage: $5/month
- Monitoring: $10/month
- Total: ~$75/month

### Scale (10k+ users):
- Servers (3x): $150/month
- Database (HA): $100/month
- Redis (HA): $30/month
- CDN: $20/month
- Monitoring: $25/month
- Total: ~$325/month

---

## Support

For deployment issues, contact:
- Email: support@mysellguid.com
- GitHub Issues: https://github.com/tmotti77/mysellguid/issues

---

**Last Updated**: November 2025

