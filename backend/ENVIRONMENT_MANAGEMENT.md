# Environment Variable Management

## Overview

MySellGuid uses environment-specific configuration files to manage settings across different deployment environments (development, staging, production).

## Environment Files

### File Structure

```
backend/
├── .env                          # Default/current environment (gitignored)
├── .env.example                  # Template with placeholders (committed)
├── .env.development.example      # Development template (committed)
├── .env.production.example       # Production template (committed)
├── .env.development              # Your local dev config (gitignored)
└── .env.production               # Production config (gitignored)
```

### File Purposes

- **`.env`** - Default environment file, used when NODE_ENV is not set
- **`.env.development`** - Development-specific settings
- **`.env.production`** - Production-specific settings
- **`.env.*.example`** - Templates without secrets (safe to commit)

## Setup

### Initial Setup (New Developer)

1. **Copy example file:**
   ```bash
   cd backend
   cp .env.example .env
   # or
   cp .env.development.example .env.development
   ```

2. **Generate JWT secrets:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   # Run twice for JWT_SECRET and JWT_REFRESH_SECRET
   ```

3. **Update API keys:**
   Edit `.env` or `.env.development` and add your:
   - Google Maps API key
   - AWS/Cloudflare credentials (if using cloud storage)
   - OpenAI API key (optional)
   - Firebase credentials (optional)

4. **Verify configuration:**
   ```bash
   npm run start:dev
   ```

## Usage

### Running with Specific Environment

```bash
# Development (default)
NODE_ENV=development npm run start:dev

# Production
NODE_ENV=production npm run start:prod

# Custom environment
NODE_ENV=staging npm run start
```

### Environment Loading Order

The application loads environment variables in this order:

1. `.env.{NODE_ENV}` (e.g., `.env.production`)
2. `.env` (fallback)
3. System environment variables (highest priority)

### Environment Configuration File

The `src/config/env.config.ts` file provides:

- **Type-safe access** to environment variables
- **Default values** for optional settings
- **Validation** to catch missing required variables
- **Centralized configuration** for the entire application

Example usage in a service:

```typescript
import { envConfig } from '../config/env.config';

export class MyService {
  getMaxFileSize() {
    return envConfig.app.maxFileSize;
  }

  getDatabaseConfig() {
    return envConfig.database;
  }
}
```

## Environment Variables Reference

### Application

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `NODE_ENV` | string | development | Environment (development, production) |
| `PORT` | number | 3000 | Server port |
| `API_PREFIX` | string | api | API route prefix |

### Database

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `DATABASE_HOST` | string | ✅ | PostgreSQL host |
| `DATABASE_PORT` | number | ✅ | PostgreSQL port |
| `DATABASE_USER` | string | ✅ | Database username |
| `DATABASE_PASSWORD` | string | ✅ | Database password |
| `DATABASE_NAME` | string | ✅ | Database name |

### Redis

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `REDIS_HOST` | string | ✅ | Redis host |
| `REDIS_PORT` | number | ✅ | Redis port |
| `REDIS_PASSWORD` | string | ❌ | Redis password (if enabled) |

### JWT

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `JWT_SECRET` | string | ✅ | Access token secret (64+ chars) |
| `JWT_EXPIRES_IN` | string | ❌ | Access token expiry (default: 7d) |
| `JWT_REFRESH_SECRET` | string | ✅ | Refresh token secret (64+ chars) |
| `JWT_REFRESH_EXPIRES_IN` | string | ❌ | Refresh token expiry (default: 30d) |

### Storage

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `STORAGE_TYPE` | enum | ❌ | r2, s3, or local (default: local) |
| `STORAGE_BUCKET` | string | ⚠️ | Bucket name (required for r2/s3) |
| `STORAGE_REGION` | string | ⚠️ | Region (required for s3) |
| `STORAGE_ACCESS_KEY` | string | ⚠️ | Access key (required for r2/s3) |
| `STORAGE_SECRET_KEY` | string | ⚠️ | Secret key (required for r2/s3) |
| `STORAGE_ENDPOINT` | string | ⚠️ | Custom endpoint (required for r2) |
| `STORAGE_PUBLIC_URL` | string | ⚠️ | Public CDN URL (required for r2/s3) |

### Google Maps

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | string | ✅ | Geocoding API key |

### OpenAI (Optional)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `OPENAI_API_KEY` | string | ❌ | OpenAI API key for AI features |

### Firebase (Optional)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `FIREBASE_PROJECT_ID` | string | ❌ | Firebase project ID |
| `FIREBASE_PRIVATE_KEY` | string | ❌ | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | string | ❌ | Firebase service account email |

### Apify (Optional)

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `APIFY_API_TOKEN` | string | ❌ | Apify API token for scraping |

### Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MAX_FILE_SIZE` | number | 5242880 | Max upload size (5MB) |
| `ALLOWED_FILE_TYPES` | string | image/jpeg,... | Allowed MIME types |
| `DEFAULT_SEARCH_RADIUS` | number | 5000 | Default search radius (meters) |
| `MAX_SEARCH_RADIUS` | number | 50000 | Max search radius (meters) |

### Rate Limiting

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `RATE_LIMIT_TTL` | number | 60 | Rate limit window (seconds) |
| `RATE_LIMIT_MAX` | number | 100 | Max requests per window |

### Logging

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | string | debug | Log level (debug, info, warn, error) |

## Best Practices

### Development

✅ **DO:**
- Use `.env.development` for local development
- Keep weak/test credentials in development
- Enable debug logging
- Use local storage (not S3/R2)
- Use Docker for PostgreSQL and Redis

❌ **DON'T:**
- Commit `.env` files with real credentials
- Use production credentials in development
- Share `.env` files (use `.env.example` instead)

### Production

✅ **DO:**
- Use strong, random secrets (128+ characters)
- Enable SSL/TLS for all connections
- Use managed services (RDS, ElastiCache, R2)
- Rotate secrets regularly (every 90 days)
- Use secrets management service (AWS Secrets Manager, Vault)
- Set appropriate rate limits
- Use `warn` or `error` log level
- Enable HTTPS only
- Restrict API keys by IP and API

❌ **DON'T:**
- Use default/weak passwords
- Expose sensitive data in logs
- Use the same secrets as development
- Commit production `.env` files

### Security Checklist

- [ ] All secrets are strong and random
- [ ] No secrets in git history
- [ ] `.env` files in `.gitignore`
- [ ] API keys have restrictions applied
- [ ] Database uses SSL
- [ ] Production uses managed services
- [ ] Secrets rotated regularly
- [ ] Monitoring and alerts configured

## Troubleshooting

### "JWT_SECRET must be set in production"

**Cause:** Missing or weak JWT secret in production environment

**Solution:**
```bash
# Generate strong secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env.production
JWT_SECRET=<generated-secret>
```

### "Cannot connect to database"

**Cause:** Incorrect database credentials or host

**Solution:**
1. Check `DATABASE_*` variables in `.env`
2. Verify PostgreSQL is running: `docker ps` or `pg_isready -h localhost`
3. Test connection: `psql -h localhost -U postgres -d mysellguid`

### "Environment file not found"

**Cause:** Missing environment-specific file

**Solution:**
```bash
# Create from example
cp .env.example .env.development
# or
cp .env.example .env
```

### "Rate limit exceeded" (during development)

**Cause:** Too many requests during testing

**Solution:**
- Increase `RATE_LIMIT_MAX` in `.env.development`
- Or temporarily disable rate limiting in code

## Migration from Old System

If upgrading from the old environment system:

1. **Backup current .env:**
   ```bash
   cp backend/.env backend/.env.backup
   ```

2. **Update imports:**
   ```typescript
   // Old
   process.env.JWT_SECRET

   // New
   import { envConfig } from './config/env.config';
   envConfig.jwt.secret
   ```

3. **Verify configuration:**
   ```bash
   npm run start:dev
   ```

## Resources

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [12-Factor App - Config](https://12factor.net/config)
- [OWASP Configuration Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Configuration_Best_Practices.html)
