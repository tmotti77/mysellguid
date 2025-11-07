import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
