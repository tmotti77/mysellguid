import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { User } from '../modules/users/entities/user.entity';
import { Store } from '../modules/stores/entities/store.entity';
import { Sale } from '../modules/sales/entities/sale.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Store, Sale])],
  controllers: [SeedController],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
