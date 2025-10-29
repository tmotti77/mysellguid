import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(storeData: Partial<Store>): Promise<Store> {
    // Create PostGIS POINT from latitude and longitude
    if (storeData.latitude && storeData.longitude) {
      storeData.location = `POINT(${storeData.longitude} ${storeData.latitude})`;
    }

    const store = this.storesRepository.create(storeData);
    return this.storesRepository.save(store);
  }

  async findAll(): Promise<Store[]> {
    return this.storesRepository.find({
      relations: ['owner'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Store> {
    const store = await this.storesRepository.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!store) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return store;
  }

  async findByOwner(ownerId: string): Promise<Store[]> {
    return this.storesRepository.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findNearby(
    latitude: number,
    longitude: number,
    radiusMeters: number = 5000,
  ): Promise<Store[]> {
    // PostGIS query to find stores within radius
    const query = `
      SELECT *,
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography
        ) as distance
      FROM stores
      WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_Point($1, $2), 4326)::geography,
        $3
      )
      AND "isActive" = true
      ORDER BY distance ASC
    `;

    return this.storesRepository.query(query, [longitude, latitude, radiusMeters]);
  }

  async update(id: string, updateData: Partial<Store>): Promise<Store> {
    const store = await this.findOne(id);

    // Update location if coordinates changed
    if (updateData.latitude && updateData.longitude) {
      updateData.location = `POINT(${updateData.longitude} ${updateData.latitude})`;
    }

    Object.assign(store, updateData);
    return this.storesRepository.save(store);
  }

  async remove(id: string): Promise<void> {
    const store = await this.findOne(id);
    await this.storesRepository.remove(store);
  }

  async incrementViews(id: string): Promise<void> {
    await this.storesRepository.increment({ id }, 'views', 1);
  }

  async updateRating(id: string, newRating: number): Promise<void> {
    const store = await this.findOne(id);
    const totalRating = store.rating * store.reviewCount + newRating;
    const newReviewCount = store.reviewCount + 1;
    const averageRating = totalRating / newReviewCount;

    await this.storesRepository.update(id, {
      rating: Math.round(averageRating * 100) / 100,
      reviewCount: newReviewCount,
    });
  }

  async search(searchTerm: string, category?: string): Promise<Store[]> {
    const query = this.storesRepository
      .createQueryBuilder('store')
      .where('store.isActive = :isActive', { isActive: true });

    if (searchTerm) {
      query.andWhere(
        '(LOWER(store.name) LIKE LOWER(:searchTerm) OR LOWER(store.description) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` },
      );
    }

    if (category) {
      query.andWhere('store.category = :category', { category });
    }

    return query.orderBy('store.rating', 'DESC').getMany();
  }
}
