# Getting Started with MySellGuid

This guide will help you get the MySellGuid project up and running on your local machine.

## Prerequisites

- Node.js 18+ and npm
- Docker & Docker Compose
- Git
- AWS Account (for S3 storage)
- OpenAI API Key
- Apify API Key (for social media scraping)
- Firebase Project (for push notifications)

## Quick Start

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd mysellguid
```

### 2. Run Setup Script

The easiest way to get started is using our setup script:

```bash
./infrastructure/scripts/setup.sh
```

This script will:
- Start PostgreSQL (with PostGIS) and Redis containers
- Create a `.env` file from the example
- Install backend dependencies

### 3. Configure Environment Variables

Edit `backend/.env` and add your API keys:

```env
# Required API Keys
OPENAI_API_KEY=sk-your-openai-key
APIFY_API_TOKEN=apify_api_your-token
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Generate a secure JWT secret
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### 4. Start the Backend

```bash
cd backend
npm run start:dev
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/api/docs

### 5. Test the API

You can test the API using the Swagger UI or with curl:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Search nearby sales (replace TOKEN with your JWT)
curl -X GET "http://localhost:3000/api/sales/nearby?lat=32.0853&lng=34.7818&radius=5000" \
  -H "Authorization: Bearer TOKEN"
```

## Project Structure

```
mysellguid/
├── backend/              # NestJS API server
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── shared/       # Shared utilities
│   │   ├── config/       # Configuration files
│   │   ├── main.ts       # Application entry point
│   │   └── app.module.ts # Root module
│   └── package.json
│
├── mobile/               # React Native mobile app
│   └── (to be implemented)
│
├── web/                  # Next.js web application
│   └── (to be implemented)
│
├── shared/               # Shared TypeScript types
│   └── (to be implemented)
│
└── infrastructure/       # Docker & deployment
    ├── docker/
    │   ├── docker-compose.yml
    │   ├── Dockerfile
    │   └── init-db.sql
    └── scripts/
        ├── setup.sh
        └── teardown.sh
```

## Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/logout` - Logout

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/nearby?lat=X&lng=Y&radius=Z` - Find nearby sales
- `GET /api/sales/search?q=keyword` - Search sales
- `POST /api/sales` - Create new sale (store dashboard)
- `GET /api/sales/:id` - Get sale details

### Stores
- `GET /api/stores` - Get all stores
- `GET /api/stores/nearby?lat=X&lng=Y&radius=Z` - Find nearby stores
- `POST /api/stores` - Register a store
- `GET /api/stores/:id` - Get store details

### Users
- `GET /api/users/me` - Get current user profile
- `PATCH /api/users/me` - Update profile
- `PATCH /api/users/me/preferences` - Update preferences
- `PATCH /api/users/me/location` - Update default location

## Database Access

### Using psql
```bash
docker exec -it mysellguid-postgres psql -U postgres -d mysellguid
```

### Using pgAdmin
Navigate to http://localhost:5050
- Email: admin@mysellguid.com
- Password: admin

Add a new server:
- Host: postgres
- Port: 5432
- Database: mysellguid
- Username: postgres
- Password: postgres

## Development Workflow

### Backend Development

```bash
cd backend

# Run in development mode with hot reload
npm run start:dev

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint

# Format code
npm run format
```

### Database Migrations

```bash
cd backend

# Generate a new migration
npm run typeorm migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

## Common Issues

### Port Already in Use

If ports 3000, 5432, or 6379 are already in use:

```bash
# Stop the containers
./infrastructure/scripts/teardown.sh

# Check what's using the port
lsof -i :3000  # or :5432, :6379

# Kill the process or change the port in docker-compose.yml
```

### Database Connection Error

Make sure PostgreSQL container is running:

```bash
docker ps | grep postgres
docker logs mysellguid-postgres
```

### Redis Connection Error

Make sure Redis container is running:

```bash
docker ps | grep redis
docker logs mysellguid-redis
```

## Next Steps

1. **Implement Mobile App**: Create React Native app in `/mobile` directory
2. **Implement Web App**: Create Next.js app in `/web` directory
3. **Add Social Media Scraping**: Integrate Apify for Instagram/Facebook scraping
4. **Add AI Analysis**: Integrate OpenAI Vision API for image analysis
5. **Add Recommendations**: Implement pgvector-based recommendation system
6. **Add Push Notifications**: Integrate Firebase Cloud Messaging
7. **Deploy to Production**: Deploy to AWS

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [TypeORM Documentation](https://typeorm.io/)
- [OpenAI API](https://platform.openai.com/docs/)
- [Apify Documentation](https://docs.apify.com/)
- [React Native](https://reactnative.dev/)
- [Next.js](https://nextjs.org/)

## Support

For issues and questions, please create an issue in the GitHub repository.

---

Happy coding! 🚀
