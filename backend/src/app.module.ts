import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StoresModule } from './modules/stores/stores.module';
import { SalesModule } from './modules/sales/sales.module';
import { ScrapingModule } from './modules/scraping/scraping.module';
import { MlModule } from './modules/ml/ml.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadModule } from './modules/upload/upload.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { UserReportsModule } from './modules/user-reports/user-reports.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { SeedModule } from './seed/seed.module';
import { HealthController } from './health.controller';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per IP per 60 seconds
      },
    ]),

    // Database - PostgreSQL with PostGIS
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get('DATABASE_URL');
        const isProduction = configService.get('NODE_ENV') === 'production';
        
        // If DATABASE_URL is provided (Render, Railway, etc.), use it
        if (databaseUrl) {
          // Allow one-time sync via SYNC_DATABASE=true env var for initial setup
          const allowSync = configService.get('SYNC_DATABASE') === 'true';
          return {
            type: 'postgres',
            url: databaseUrl,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: allowSync, // Set SYNC_DATABASE=true for initial setup only!
            logging: !isProduction,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            extra: isProduction ? { ssl: { rejectUnauthorized: false } } : {},
          };
        }
        
        // Local development with individual env vars
        return {
          type: 'postgres',
          host: configService.get('DATABASE_HOST'),
          port: configService.get('DATABASE_PORT'),
          username: configService.get('DATABASE_USER'),
          password: configService.get('DATABASE_PASSWORD'),
          database: configService.get('DATABASE_NAME'),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: !isProduction,
          logging: !isProduction,
          ssl: false,
        };
      },
      inject: [ConfigService],
    }),

    // Redis Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get('REDIS_URL');
        
        // If REDIS_URL is provided (Render, Railway, etc.), use it
        if (redisUrl) {
          return { redis: redisUrl };
        }
        
        // Local development
        return {
          redis: {
            host: configService.get('REDIS_HOST') || 'localhost',
            port: configService.get('REDIS_PORT') || 6379,
            password: configService.get('REDIS_PASSWORD'),
          },
        };
      },
      inject: [ConfigService],
    }),

    // Feature modules
    AuthModule,
    UsersModule,
    StoresModule,
    SalesModule,
    ScrapingModule,
    MlModule,
    FirebaseModule,
    NotificationsModule,
    UploadModule,
    BookmarksModule,
    UserReportsModule,
    TelegramModule,
    DiscoveryModule,
    SeedModule,

    // TypeORM for health check
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [HealthController],
  providers: [
    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
