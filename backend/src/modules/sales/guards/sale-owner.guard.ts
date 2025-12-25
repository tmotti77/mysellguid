import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { SalesService } from '../sales.service';
import { StoresService } from '../../stores/stores.service';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class SaleOwnerGuard implements CanActivate {
  constructor(
    private readonly salesService: SalesService,
    private readonly storesService: StoresService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const saleId = request.params.id;
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is admin
    if (request.user.role === UserRole.ADMIN) {
      return true;
    }

    try {
      const sale = await this.salesService.findOne(saleId);
      const store = await this.storesService.findOne(sale.storeId);

      if (store.ownerId !== userId) {
        throw new ForbiddenException('You do not have permission to modify this sale');
      }

      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException('Access denied');
    }
  }
}
