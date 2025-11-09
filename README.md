# MySellGuid

**Local Sales Discovery Platform** - Never miss a sale again!

MySellGuid helps you discover sales and discounts from nearby stores in real-time by aggregating data from social media, store dashboards, and user reports. Get personalized recommendations based on your preferences and location.

## Features

- **Location-based Discovery**: Find sales within a customizable radius (e.g., 5km)
- **Multi-source Data**:
  - Social media scraping (Instagram, Facebook)
  - Direct store dashboard for businesses
  - Crowdsourced user reports
- **AI-Powered Personalization**: Learn your preferences and recommend relevant sales
- **Real-time Notifications**: Get notified when sales match your interests nearby
- **Cross-platform**: Mobile apps (iOS & Android) + Web application
- **Multi-language**: Hebrew and English support with RTL

## Tech Stack

### Backend
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: Neon PostgreSQL 17 + PostGIS (IPv4 compatible, geospatial queries)
- **Caching**: Redis (Upstash)
- **Queue**: Bull (Redis-backed job queue)
- **MCP Integration**: Claude can control database via Neon MCP server

### Mobile
- **Framework**: React Native + Expo
- **Maps**: React Native Maps
- **Notifications**: Firebase Cloud Messaging

### Web
- **Framework**: Next.js 14 (React + TypeScript)
- **Styling**: Tailwind CSS

### AI/ML
- **Image Analysis**: OpenAI GPT-4 Vision API
- **Recommendations**: pgvector + OpenAI Embeddings
- **Scraping**: Apify

## Project Structure

```
mysellguid/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/           # Authentication & JWT
│   │   │   ├── users/          # User management
│   │   │   ├── stores/         # Store dashboard
│   │   │   ├── sales/          # Sales CRUD + geospatial
│   │   │   ├── scraping/       # Social media scraping
│   │   │   ├── ml/             # AI/ML integration
│   │   │   └── notifications/  # Push notifications
│   │   ├── shared/             # Shared utilities
│   │   └── main.ts
│   └── package.json
│
├── mobile/               # React Native mobile app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── web/                  # Next.js web application
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
│
├── shared/               # Shared TypeScript types & utils
│   ├── src/
│   │   ├── types/
│   │   └── constants/
│   └── package.json
│
└── infrastructure/       # Docker, AWS configs
    ├── docker/
    ├── terraform/
    └── scripts/
```

## Getting Started

**📚 Quick Start Guides:**
- **[LOCAL_MACHINE_SETUP.md](LOCAL_MACHINE_SETUP.md)** - **START HERE!** Complete step-by-step setup with cloud databases (Recommended)
- **[LOCAL_DATABASE_SETUP.md](LOCAL_DATABASE_SETUP.md)** - Run PostgreSQL and Redis locally instead of cloud
- **[COMPLETE_PROJECT_SUMMARY.md](COMPLETE_PROJECT_SUMMARY.md)** - Full project analysis, architecture, and roadmap

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+ with PostGIS extension (or use cloud database - see LOCAL_MACHINE_SETUP.md)
- Redis 7+ (or use cloud Redis - see LOCAL_MACHINE_SETUP.md)
- Docker & Docker Compose (optional)
- AWS Account (optional for S3 image storage)
- OpenAI API Key (optional for AI features)
- Apify API Key (optional for social media scraping)
- Firebase Project (optional for push notifications)

### Environment Variables

Create `.env` files in each workspace:

**Backend (`backend/.env`):**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mysellguid
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# AWS
AWS_REGION=il-central-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=mysellguid-images

# OpenAI
OPENAI_API_KEY=sk-...

# Apify
APIFY_API_KEY=apify_api_...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mysellguid

# Install all dependencies
npm run install-all

# Setup PostgreSQL with PostGIS
psql -U postgres
CREATE DATABASE mysellguid;
\c mysellguid
CREATE EXTENSION postgis;
CREATE EXTENSION vector;  # For pgvector

# Run database migrations
cd backend
npm run migration:run

# Start Redis
redis-server

# Start the backend
npm run backend

# In another terminal, start mobile app
npm run mobile

# In another terminal, start web app
npm run web
```

### Docker Setup (Alternative)

```bash
# Start all services with Docker Compose
cd infrastructure/docker
docker-compose up -d

# The backend will be available at http://localhost:3000
# PostgreSQL at localhost:5432
# Redis at localhost:6379
```

## Development

### Backend Development

```bash
cd backend

# Run in development mode with hot reload
npm run start:dev

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Generate new module
nest g module modules/feature-name
nest g service modules/feature-name
nest g controller modules/feature-name
```

### Mobile Development

```bash
cd mobile

# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Build for production
eas build --platform all
```

### Web Development

```bash
cd web

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## API Documentation

Once the backend is running, API documentation is available at:
- Swagger UI: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs-json

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Sales
- `GET /api/sales/nearby` - Get sales within radius
  - Query params: `lat`, `lng`, `radius` (meters), `category`
- `GET /api/sales/:id` - Get sale details
- `POST /api/sales` - Create sale (store dashboard)

### Stores
- `POST /api/stores/register` - Register store
- `GET /api/stores/:id` - Get store details
- `PUT /api/stores/:id` - Update store info

### Users
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/preferences` - Update user preferences

## Deployment

### AWS Deployment

See `infrastructure/terraform/` for Infrastructure as Code setup.

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan

# Apply changes
terraform apply
```

### Mobile App Deployment

```bash
cd mobile

# Configure EAS (Expo Application Services)
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to app stores
eas submit --platform all
```

## Database Schema

Key tables:
- `users` - User accounts with preferences
- `stores` - Store information with geolocation
- `sales` - Sales with geospatial indexing
- `sale_images` - Image URLs and AI-extracted metadata
- `user_interactions` - For recommendation learning
- `notifications` - Push notification history

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific workspace tests
npm run test --workspace=backend
```

## Performance Considerations

- **Geospatial Queries**: PostGIS GiST indexes for sub-100ms queries
- **Caching**: Redis for frequent queries (nearby sales, user preferences)
- **Image CDN**: CloudFront for fast image delivery
- **Database Optimization**: Read replicas for scaling reads
- **Background Jobs**: Bull queues for async operations (scraping, ML)

## Monitoring

- **Error Tracking**: Sentry integration
- **Logs**: CloudWatch Logs
- **Metrics**: CloudWatch Metrics + custom dashboards
- **APM**: New Relic (optional)

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- SQL injection prevention (TypeORM parameterized queries)
- XSS protection
- CORS configuration
- Environment variable validation

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue in the repository
- Email: support@mysellguid.com

## Roadmap

- [x] Phase 1: Core backend and geospatial search
- [x] Phase 2: Mobile app with React Native
- [ ] Phase 3: Social media scraping integration
- [ ] Phase 4: AI recommendations
- [ ] Phase 5: Real-time notifications
- [ ] Phase 6: Web application
- [ ] Phase 7: Multi-region expansion
- [ ] Phase 8: Advanced analytics dashboard

---

Built with by the MySellGuid team
