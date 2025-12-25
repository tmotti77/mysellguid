import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment-specific .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
const envPath = join(__dirname, '../../', envFile);

dotenv.config({ path: envPath });

// Fallback to default .env if environment-specific file doesn't exist
dotenv.config({ path: join(__dirname, '../../.env') });

export interface EnvConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;

  // Database
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };

  // Redis
  redis: {
    host: string;
    port: number;
    password?: string;
  };

  // JWT
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  // Storage
  storage: {
    type: 'r2' | 's3' | 'local';
    bucket?: string;
    region?: string;
    accessKey?: string;
    secretKey?: string;
    endpoint?: string;
    publicUrl?: string;
  };

  // Google Maps
  googleMaps: {
    apiKey: string;
  };

  // OpenAI
  openai: {
    apiKey?: string;
  };

  // Firebase
  firebase: {
    projectId?: string;
    privateKey?: string;
    clientEmail?: string;
  };

  // Apify
  apify: {
    apiToken?: string;
  };

  // Application Settings
  app: {
    maxFileSize: number;
    allowedFileTypes: string[];
    defaultSearchRadius: number;
    maxSearchRadius: number;
  };

  // Rate Limiting
  rateLimit: {
    ttl: number;
    max: number;
  };

  // Logging
  logging: {
    level: string;
  };
}

export const envConfig: EnvConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',

  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    database: process.env.DATABASE_NAME || 'mysellguid',
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRATION || '30d',
  },

  storage: {
    type: (process.env.STORAGE_TYPE as 'r2' | 's3' | 'local') || 'local',
    bucket: process.env.STORAGE_BUCKET || process.env.S3_BUCKET_NAME,
    region: process.env.STORAGE_REGION || process.env.AWS_REGION,
    accessKey: process.env.STORAGE_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.STORAGE_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.STORAGE_ENDPOINT || process.env.S3_ENDPOINT,
    publicUrl: process.env.STORAGE_PUBLIC_URL,
  },

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  },

  apify: {
    apiToken: process.env.APIFY_API_TOKEN,
  },

  app: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
    allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(
      ',',
    ),
    defaultSearchRadius: parseInt(process.env.DEFAULT_SEARCH_RADIUS || '5000', 10), // 5km
    maxSearchRadius: parseInt(process.env.MAX_SEARCH_RADIUS || '50000', 10), // 50km
  },

  rateLimit: {
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validation function
export function validateEnvConfig(): void {
  const errors: string[] = [];

  // Required in production
  if (envConfig.nodeEnv === 'production') {
    if (!envConfig.jwt.secret || envConfig.jwt.secret === 'your-jwt-secret') {
      errors.push('JWT_SECRET must be set in production');
    }
    if (!envConfig.jwt.refreshSecret || envConfig.jwt.refreshSecret === 'your-refresh-secret') {
      errors.push('JWT_REFRESH_SECRET must be set in production');
    }
    // Note: Google Maps API key is optional for MVP - geocoding can be done client-side
    // if (!envConfig.googleMaps.apiKey) {
    //   errors.push('GOOGLE_MAPS_API_KEY must be set');
    // }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }
}

// Run validation
if (process.env.NODE_ENV !== 'test') {
  validateEnvConfig();
}

export default envConfig;
