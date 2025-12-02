import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark.entity';
import { Sale } from '../sales/entities/sale.entity';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private bookmarksRepository: Repository<Bookmark>,
    @InjectRepository(Sale)
    private salesRepository: Repository<Sale>,
  ) {}

  /**
   * Add a sale to user's bookmarks
   */
  async addBookmark(userId: string, saleId: string): Promise<Bookmark> {
    // Check if sale exists
    const sale = await this.salesRepository.findOne({ where: { id: saleId } });
    if (!sale) {
      throw new NotFoundException(`Sale with ID ${saleId} not found`);
    }

    // Check if bookmark already exists
    const existing = await this.bookmarksRepository.findOne({
      where: { userId, saleId },
    });

    if (existing) {
      throw new ConflictException('Sale already bookmarked');
    }

    // Increment saves count on sale
    await this.salesRepository.increment({ id: saleId }, 'saves', 1);

    // Create bookmark using raw query to handle composite key properly
    const result = await this.bookmarksRepository.query(
      `INSERT INTO bookmarks ("userId", "saleId") VALUES ($1, $2) RETURNING *`,
      [userId, saleId],
    );

    return result[0];
  }

  /**
   * Remove a sale from user's bookmarks
   */
  async removeBookmark(userId: string, saleId: string): Promise<void> {
    const bookmark = await this.bookmarksRepository.findOne({
      where: { userId, saleId },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarksRepository.remove(bookmark);

    // Decrement saves count on sale
    await this.salesRepository.decrement({ id: saleId }, 'saves', 1);
  }

  /**
   * Check if a sale is bookmarked by user
   */
  async isBookmarked(userId: string, saleId: string): Promise<boolean> {
    const count = await this.bookmarksRepository.count({
      where: { userId, saleId },
    });
    return count > 0;
  }

  /**
   * Get all bookmarked sales for a user
   */
  async getUserBookmarks(userId: string): Promise<Sale[]> {
    const bookmarks = await this.bookmarksRepository.find({
      where: { userId },
      relations: ['sale', 'sale.store'],
      order: { createdAt: 'DESC' },
    });

    const sales = bookmarks.map((bookmark) => bookmark.sale);

    // Fix: Convert simple-array strings to actual arrays
    sales.forEach((sale) => {
      if (typeof sale.images === 'string') {
        (sale as any).images = (sale.images as string).split(',');
      }
    });

    return sales;
  }

  /**
   * Get bookmark IDs for multiple sales (for checking which ones are bookmarked)
   */
  async getBookmarkedSaleIds(userId: string, saleIds: string[]): Promise<string[]> {
    const bookmarks = await this.bookmarksRepository.find({
      where: {
        userId,
      },
      select: ['saleId'],
    });

    const bookmarkedIds = bookmarks.map((b) => b.saleId);
    return saleIds.filter((id) => bookmarkedIds.includes(id));
  }

  /**
   * Get user's bookmarks with distance (for SavedScreen)
   */
  async getUserBookmarksWithDistance(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<any[]> {
    const query = `
      SELECT
        s.id,
        s.title,
        s.description,
        s.category,
        s."discountPercentage",
        s."originalPrice",
        s."salePrice",
        s.currency,
        s."startDate",
        s."endDate",
        s.status,
        string_to_array(s.images, ',') as images,
        s."storeId",
        s.latitude,
        s.longitude,
        s.source,
        s."sourceUrl",
        s."sourceId",
        s."aiMetadata",
        s.views,
        s.clicks,
        s.shares,
        s.saves,
        s."createdAt",
        s."updatedAt",
        json_build_object(
          'id', st.id,
          'name', st.name,
          'category', st.category,
          'logo', st.logo,
          'address', st.address,
          'city', st.city
        ) as store,
        ST_Distance(
          s.location::geography,
          ST_SetSRID(ST_Point($1, $2), 4326)::geography
        ) as distance
      FROM bookmarks b
      INNER JOIN sales s ON b."saleId" = s.id
      INNER JOIN stores st ON s."storeId" = st.id
      WHERE b."userId" = $3
      ORDER BY b."createdAt" DESC
    `;

    return this.bookmarksRepository.query(query, [longitude, latitude, userId]);
  }
}
