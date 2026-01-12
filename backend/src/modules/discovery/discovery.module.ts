import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DiscoveryService } from './discovery.service';
import { DiscoveryController } from './discovery.controller';
import { MlModule } from '../ml/ml.module';
import { Sale } from '../sales/entities/sale.entity';
import { Store } from '../stores/entities/store.entity';

@Module({
  imports: [
    ConfigModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Sale, Store]),
    MlModule,
  ],
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
