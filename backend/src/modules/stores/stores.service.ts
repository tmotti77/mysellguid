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
    // Ensure we have coordinates
    let lat = storeData.latitude;
    let lng = storeData.longitude;

    if (!lat || !lng) {
      if (storeData.address && storeData.city) {
        // Try to geocode address using Google Maps API
        try {
          const apiKey = process.env.GOOGLE_MAPS_API_KEY;
          if (apiKey) {
            const address = `${storeData.address}, ${storeData.city}, ${storeData.country || 'Israel'}`;
            const response = await axios.get(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
            );

            if (response.data.results && response.data.results.length > 0) {
              lat = response.data.results[0].geometry.location.lat;
              lng = response.data.results[0].geometry.location.lng;
            }
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      // Fallback to Tel Aviv center if no coordinates
      if (!lat || !lng) {
        lat = 32.0853;
        lng = 34.7818;
        console.warn('Using default Tel Aviv coordinates for store');
      }
    }

    // Use raw SQL to properly insert with PostGIS geography column
    try {
      const result = await this.storesRepository.query(
        `INSERT INTO stores (
          name, description, category, address, city, country, "postalCode",
          latitude, longitude, location,
          "phoneNumber", email, website, "instagramHandle", "facebookPage",
          logo, "coverImage", "openingHours", "ownerId", "isVerified", "isActive"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, ST_SetSRID(ST_Point($10, $11), 4326)::geography,
          $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22
        ) RETURNING *`,
        [
          storeData.name,
          storeData.description || null,
          storeData.category || 'other',
          storeData.address,
          storeData.city,
          storeData.country || 'Israel',
          storeData.postalCode || null,
          lat,
          lng,
          lng, // longitude first for ST_Point
          lat, // latitude second for ST_Point
          storeData.phoneNumber || null,
          storeData.email || null,
          storeData.website || null,
          storeData.instagramHandle || null,
          storeData.facebookPage || null,
          storeData.logo || null,
          storeData.coverImage || null,
          storeData.openingHours ? JSON.stringify(storeData.openingHours) : null,
          storeData.ownerId,
          false, // isVerified - new stores are not verified by default
          true,  // isActive
        ],
      );

      return result[0];
    } catch (error) {
      console.error('Store creation error:', error);
      throw error;
    }
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
