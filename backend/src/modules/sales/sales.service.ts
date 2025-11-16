import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Sale, SaleStatus } from './entities/sale.entity';

export interface NearbySearchOptions {
  latitude: number;
  longitude: number;
  radius?: number;
  category?: string;
  minDiscount?: number;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
  ) {}

  async create(saleData: Partial<Sale>): Promise<Sale> {
    // Create PostGIS POINT from latitude and longitude
    if (saleData.latitude && saleData.longitude) {
      saleData.location = `POINT(${saleData.longitude} ${saleData.latitude})`;
    }

    const sale = this.salesRepository.create(saleData);
    return this.salesRepository.save(sale);
  }

  async findAll(options?: {
    category?: string;
    status?: SaleStatus;
    limit?: number;
    offset?: number;
  }): Promise<Sale[]> {
    const query = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.store', 'store')
      .orderBy('sale.createdAt', 'DESC');

    if (options?.category) {
      query.andWhere('sale.category = :category', { category: options.category });
    }

    if (options?.status) {
      query.andWhere('sale.status = :status', { status: options.status });
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    if (options?.offset) {
      query.skip(options.offset);
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['store'],
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  async findNearby(options: NearbySearchOptions): Promise<Sale[]> {
    const {
      latitude,
      longitude,
      radius = 5000,
      category,
      minDiscount,
      activeOnly = true,
      limit = 50,
      offset = 0,
    } = options;

    // Build PostGIS query for nearby sales
    let query = `
      SELECT
        sale.*,
        ST_Distance(
          sale.location::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography
        ) as distance,
        json_build_object(
          'id', store.id,
          'name', store.name,
          'category', store.category,
          'logo', store.logo,
          'address', store.address,
          'city', store.city
        ) as store
      FROM sales sale
      LEFT JOIN stores store ON sale."storeId" = store.id
      WHERE ST_DWithin(
        sale.location::geography,
        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
        $3
      )
    `;

    const params: any[] = [longitude, latitude, radius];
    let paramIndex = 4;

    // Filter by active status
    if (activeOnly) {
      query += ` AND sale.status = 'active'`;
      // TODO: Fix date comparison - temporarily disabled
      // query += ` AND sale."startDate" <= NOW()`;
      // query += ` AND sale."endDate" >= NOW()`;
    }

    // Filter by category
    if (category) {
      query += ` AND sale.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Filter by minimum discount
    if (minDiscount) {
      query += ` AND sale."discountPercentage" >= $${paramIndex}`;
      params.push(minDiscount);
      paramIndex++;
    }

    // Order by distance and add pagination
    query += ` ORDER BY distance ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    return this.salesRepository.query(query, params);
  }

  async findByStore(storeId: string): Promise<Sale[]> {
    return this.salesRepository.find({
      where: { storeId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateData: Partial<Sale>): Promise<Sale> {
    const sale = await this.findOne(id);

    // Update location if coordinates changed
    if (updateData.latitude && updateData.longitude) {
      updateData.location = `POINT(${updateData.longitude} ${updateData.latitude})`;
    }

    Object.assign(sale, updateData);
    return this.salesRepository.save(sale);
  }

  async remove(id: string): Promise<void> {
    const sale = await this.findOne(id);
    await this.salesRepository.remove(sale);
  }

  async incrementViews(id: string): Promise<void> {
    await this.salesRepository.increment({ id }, 'views', 1);
  }

  async incrementClicks(id: string): Promise<void> {
    await this.salesRepository.increment({ id }, 'clicks', 1);
  }

  async incrementShares(id: string): Promise<void> {
    await this.salesRepository.increment({ id }, 'shares', 1);
  }

  async incrementSaves(id: string): Promise<void> {
    await this.salesRepository.increment({ id }, 'saves', 1);
  }

  async updateStatus(id: string, status: SaleStatus): Promise<Sale> {
    return this.update(id, { status });
  }

  async expireOldSales(): Promise<void> {
    // Find and expire sales that have passed their end date
    await this.salesRepository
      .createQueryBuilder()
      .update(Sale)
      .set({ status: SaleStatus.EXPIRED })
      .where('status = :status', { status: SaleStatus.ACTIVE })
      .andWhere('endDate < :now', { now: new Date() })
      .execute();
  }

  async search(searchTerm: string, options?: {
    category?: string;
    minDiscount?: number;
    limit?: number;
  }): Promise<Sale[]> {
    const query = this.salesRepository
      .createQueryBuilder('sale')
      .leftJoinAndSelect('sale.store', 'store')
      .where('sale.status = :status', { status: SaleStatus.ACTIVE });

    if (searchTerm) {
      query.andWhere(
        '(LOWER(sale.title) LIKE LOWER(:searchTerm) OR LOWER(sale.description) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    if (options?.category) {
      query.andWhere('sale.category = :category', { category: options.category });
    }

    if (options?.minDiscount) {
      query.andWhere('sale.discountPercentage >= :minDiscount', {
        minDiscount: options.minDiscount,
      });
    }

    if (options?.limit) {
      query.take(options.limit);
    }

    return query.orderBy('sale.discountPercentage', 'DESC').getMany();
  }

  async getStatistics(storeId?: string) {
    const query = this.salesRepository.createQueryBuilder('sale');

    if (storeId) {
      query.where('sale.storeId = :storeId', { storeId });
    }

    const [total, active, expired] = await Promise.all([
      query.getCount(),
      query.clone().andWhere('sale.status = :status', { status: SaleStatus.ACTIVE }).getCount(),
      query.clone().andWhere('sale.status = :status', { status: SaleStatus.EXPIRED }).getCount(),
    ]);

    const { totalViews, totalClicks } = await query
      .select('SUM(sale.views)', 'totalViews')
      .addSelect('SUM(sale.clicks)', 'totalClicks')
      .getRawOne();

    return {
      total,
      active,
      expired,
      totalViews: parseInt(totalViews) || 0,
      totalClicks: parseInt(totalClicks) || 0,
      clickThroughRate: totalViews > 0 ? (totalClicks / totalViews) * 100 : 0,
    };
  }
}
