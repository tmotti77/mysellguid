import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from './entities/sale.entity';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { StoresModule } from '../stores/stores.module';
import { SaleOwnerGuard } from './guards/sale-owner.guard';
import { UploadModule } from '../upload/upload.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Sale]), StoresModule, UploadModule, NotificationsModule],
  controllers: [SalesController],
  providers: [SalesService, SaleOwnerGuard],
  exports: [SalesService],
})
export class SalesModule { }
