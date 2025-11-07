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
    // Use raw SQL to insert with PostGIS geography (same approach as seed script)
    if (!storeData.latitude || !storeData.longitude) {
      throw new Error('Latitude and longitude are required');
    }

    const result = await this.storesRepository.query(
      `INSERT INTO stores (name, description, category, address, city, country, latitude, longitude, location, "phoneNumber", email, website, "instagramHandle", "facebookPage", "ownerId", "isVerified", rating, "reviewCount", "isActive")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, ST_SetSRID(ST_Point($9, $10), 4326)::geography, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
       RETURNING *`,
      [
        storeData.name,
        storeData.description || '',
        storeData.category || 'other',
        storeData.address || '',
        storeData.city || '',
        storeData.country || '',
        storeData.latitude,
        storeData.longitude,
        storeData.longitude,
        storeData.latitude,
        storeData.phoneNumber || null,
        storeData.email || null,
        storeData.website || null,
        storeData.instagramHandle || null,
        storeData.facebookPage || null,
        storeData.ownerId || null,
        storeData.isVerified || false,
        storeData.rating || 0,
        storeData.reviewCount || 0,
        storeData.isActive !== undefined ? storeData.isActive : true,
      ],
    );

    return result[0];
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

    // If coordinates changed, use raw SQL to update location
    if (updateData.latitude && updateData.longitude) {
      await this.storesRepository.query(
        `UPDATE stores
         SET latitude = $1, longitude = $2, location = ST_SetSRID(ST_Point($3, $4), 4326)::geography
         WHERE id = $5`,
        [updateData.latitude, updateData.longitude, updateData.longitude, updateData.latitude, id],
      );
      delete updateData.location; // Remove from updateData to avoid conflict
    }

    // Update other fields normally
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
