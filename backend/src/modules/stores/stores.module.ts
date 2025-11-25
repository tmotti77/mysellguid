import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';
import { StoresController } from './stores.controller';
import { StoreOwnerGuard } from './guards/store-owner.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Store])],
  controllers: [StoresController],
  providers: [StoresService, StoreOwnerGuard],
  exports: [StoresService],
})
export class StoresModule {}
