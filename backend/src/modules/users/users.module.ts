import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserSavedSale } from './entities/user-saved-sale.entity';
import { UsersService } from './users.service';
import { UserSavedSalesService } from './user-saved-sales.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserSavedSale])],
  controllers: [UsersController],
  providers: [UsersService, UserSavedSalesService],
  exports: [UsersService, UserSavedSalesService],
})
export class UsersModule {}
