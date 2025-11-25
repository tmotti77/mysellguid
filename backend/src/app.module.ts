import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 20, // 20 requests per 60 seconds (default for all endpoints)
    }]),

    // Database - PostgreSQL with PostGIS
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development', // Disable in production
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production',
      }),
      inject: [ConfigService],
    }),

    // Redis Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          password: configService.get('REDIS_PASSWORD'),
        },
      }),
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
    SeedModule,
  ],
})
export class AppModule {}
