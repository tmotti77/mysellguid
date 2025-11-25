import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSavedSale } from './entities/user-saved-sale.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class UserSavedSalesService {
  constructor(
    @InjectRepository(UserSavedSale)
    private savedSalesRepository: Repository<UserSavedSale>,
  ) {}

  async saveSale(userId: string, saleId: string, metadata?: any): Promise<UserSavedSale> {
    // Check if already saved
    const existing = await this.savedSalesRepository.findOne({
      where: { userId, saleId },
    });

    if (existing) {
      throw new ConflictException('Sale already saved');
    }

    const savedSale = this.savedSalesRepository.create({
      userId,
      saleId,
      metadata,
    });

    return this.savedSalesRepository.save(savedSale);
  }

  async unsaveSale(userId: string, saleId: string): Promise<void> {
    const savedSale = await this.savedSalesRepository.findOne({
      where: { userId, saleId },
    });

    if (!savedSale) {
      throw new NotFoundException('Saved sale not found');
    }

    await this.savedSalesRepository.remove(savedSale);
  }

  async getUserSavedSales(userId: string, limit: number = 50, offset: number = 0): Promise<Sale[]> {
    const savedSales = await this.savedSalesRepository.find({
      where: { userId },
      relations: ['sale', 'sale.store'],
      order: { savedAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return savedSales.map(ss => ss.sale);
  }

  async isSaleSaved(userId: string, saleId: string): Promise<boolean> {
    const count = await this.savedSalesRepository.count({
      where: { userId, saleId },
    });

    return count > 0;
  }

  async getSavedSalesCount(userId: string): Promise<number> {
    return this.savedSalesRepository.count({
      where: { userId },
    });
  }

  async updateMetadata(userId: string, saleId: string, metadata: any): Promise<UserSavedSale> {
    const savedSale = await this.savedSalesRepository.findOne({
      where: { userId, saleId },
    });

    if (!savedSale) {
      throw new NotFoundException('Saved sale not found');
    }

    savedSale.metadata = { ...savedSale.metadata, ...metadata };
    return this.savedSalesRepository.save(savedSale);
  }
}
