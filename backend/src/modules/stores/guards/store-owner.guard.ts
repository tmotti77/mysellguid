import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { StoresService } from '../stores.service';

@Injectable()
export class StoreOwnerGuard implements CanActivate {
  constructor(private readonly storesService: StoresService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const storeId = request.params.id;
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user is admin
    if (request.user.role === 'ADMIN') {
      return true;
    }

    try {
      const store = await this.storesService.findOne(storeId);

      if (store.ownerId !== userId) {
        throw new ForbiddenException('You do not have permission to modify this store');
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
