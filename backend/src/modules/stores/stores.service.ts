import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Store } from './entities/store.entity';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(Store)
    private storesRepository: Repository<Store>,
  ) {}

  async create(storeData: Partial<Store>): Promise<Store> {
    // Create PostGIS POINT from latitude and longitude (WKT format)
    if (storeData.latitude && storeData.longitude) {
      storeData.location = `POINT(${storeData.longitude} ${storeData.latitude})`;
    } else if (storeData.address && storeData.city) {
      // Geocode address using Google Maps API
      try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (apiKey) {
          const address = `${storeData.address}, ${storeData.city}, ${storeData.country || 'Israel'}`;
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
          );

          if (response.data.results && response.data.results.length > 0) {
            const { lat, lng } = response.data.results[0].geometry.location;
            storeData.latitude = lat;
            storeData.longitude = lng;
            storeData.location = `POINT(${lng} ${lat})`;
          } else {
            // Fallback if geocoding fails to find results
            console.warn(`Geocoding failed for address: ${address}`);
            const defaultLat = 32.0853;
            const defaultLng = 34.7818;
            storeData.latitude = defaultLat;
            storeData.longitude = defaultLng;
            storeData.location = `POINT(${defaultLng} ${defaultLat})`;
          }
        } else {
          // Fallback if no API key
          console.warn('GOOGLE_MAPS_API_KEY not configured');
          const defaultLat = 32.0853;
          const defaultLng = 34.7818;
          storeData.latitude = defaultLat;
          storeData.longitude = defaultLng;
          storeData.location = `POINT(${defaultLng} ${defaultLat})`;
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        // Fallback on error
        const defaultLat = 32.0853;
        const defaultLng = 34.7818;
        storeData.latitude = defaultLat;
        storeData.longitude = defaultLng;
        storeData.location = `POINT(${defaultLng} ${defaultLat})`;
      }
    } else {
      // Final fallback
      const defaultLat = 32.0853;
      const defaultLng = 34.7818;
      storeData.latitude = defaultLat;
      storeData.longitude = defaultLng;
      storeData.location = `POINT(${defaultLng} ${defaultLat})`;
    }

    const store = this.storesRepository.create(storeData);
    return this.storesRepository.save(store);
  }

  async findAll(limit: number = 20, offset: number = 0): Promise<Store[]> {
    // Use raw query to avoid geography column serialization issues
    const stores = await this.storesRepository.query(`
      SELECT
        id, name, description, category, logo, "coverImage",
        email, "phoneNumber", website, "instagramHandle", "facebookPage",
        address, city, "postalCode", country,
        latitude, longitude,
        "openingHours", "ownerId", "isVerified", "isActive",
        "totalSales", views, rating, "reviewCount",
        "createdAt", "updatedAt"
      FROM stores
      ORDER BY "createdAt" DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    return stores;
  }

  async findOne(id: string): Promise<Store> {
    // Use raw query to avoid geography column serialization issues
    const stores = await this.storesRepository.query(`
      SELECT
        s.id, s.name, s.description, s.category, s.logo, s."coverImage",
        s.email, s."phoneNumber", s.website, s."instagramHandle", s."facebookPage",
        s.address, s.city, s."postalCode", s.country,
        s.latitude, s.longitude,
        s."openingHours", s."ownerId", s."isVerified", s."isActive",
        s."totalSales", s.views, s.rating, s."reviewCount",
        s."createdAt", s."updatedAt"
      FROM stores s
      WHERE s.id = $1
    `, [id]);

    if (!stores || stores.length === 0) {
      throw new NotFoundException(`Store with ID ${id} not found`);
    }

    return stores[0];
  }

  async findByOwner(ownerId: string): Promise<Store[]> {
    // Use raw query to avoid geography column serialization issues
    const stores = await this.storesRepository.query(`
      SELECT
        id, name, description, category, logo, "coverImage",
        email, "phoneNumber", website, "instagramHandle", "facebookPage",
        address, city, "postalCode", country,
        latitude, longitude,
        "openingHours", "ownerId", "isVerified", "isActive",
        "totalSales", views, rating, "reviewCount",
        "createdAt", "updatedAt"
      FROM stores
      WHERE "ownerId" = $1
      ORDER BY "createdAt" DESC
    `, [ownerId]);
    return stores;
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
    // Use raw query to avoid geography column serialization issues
    let query = `
      SELECT
        id, name, description, category, logo, "coverImage",
        email, "phoneNumber", website, "instagramHandle", "facebookPage",
        address, city, "postalCode", country,
        latitude, longitude,
        "openingHours", "ownerId", "isVerified", "isActive",
        "totalSales", views, rating, "reviewCount",
        "createdAt", "updatedAt"
      FROM stores
      WHERE "isActive" = true
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (searchTerm) {
      query += ` AND (LOWER(name) LIKE LOWER($${paramIndex}) OR LOWER(description) LIKE LOWER($${paramIndex}))`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY rating DESC`;

    return this.storesRepository.query(query, params);
  }
}
