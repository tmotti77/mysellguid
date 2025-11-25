import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

export enum SaleCategory {
  FASHION = 'fashion',
  CLOTHING = 'clothing',
  SHOES = 'shoes',
  ACCESSORIES = 'accessories',
  ELECTRONICS = 'electronics',
  HOME = 'home',
  HOME_GOODS = 'home_goods',
  FURNITURE = 'furniture',
  BEAUTY = 'beauty',
  SPORTS = 'sports',
  BOOKS = 'books',
  TOYS = 'toys',
  FOOD = 'food',
  OTHER = 'other',
}

export enum SaleSource {
  STORE_DASHBOARD = 'store_dashboard',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  USER_REPORT = 'user_report',
  API = 'api',
}

export enum SaleStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  PENDING = 'pending',
  REJECTED = 'rejected',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: SaleCategory,
    default: SaleCategory.OTHER,
  })
  category: SaleCategory;

  // Discount information
  @Column({ type: 'int', nullable: true })
  discountPercentage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salePrice: number;

  @Column({ default: 'ILS' })
  currency: string;

  // Sale validity
  @Column({ type: 'timestamp', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.ACTIVE,
  })
  status: SaleStatus;

  // Images
  @Column({ type: 'simple-array' })
  images: string[];

  // Store relation
  @ManyToOne(() => Store)
  @JoinColumn()
  store: Store;

  @Column()
  @Index()
  storeId: string;

  // Geospatial data (inherited from store, but duplicated for faster queries)
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  // Data source
  @Column({
    type: 'enum',
    enum: SaleSource,
    default: SaleSource.STORE_DASHBOARD,
  })
  source: SaleSource;

  @Column({ nullable: true })
  sourceUrl: string; // Original Instagram/Facebook post URL

  @Column({ nullable: true })
  sourceId: string; // Original post ID from social media

  // AI extracted data
  @Column({ type: 'jsonb', nullable: true })
  aiMetadata: {
    extractedText?: string;
    detectedProducts?: string[];
    confidence?: number;
    processingDate?: Date;
  };

  // Engagement metrics
  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ default: 0 })
  shares: number;

  @Column({ default: 0 })
  saves: number;

  // ML vector for recommendations (pgvector) - disabled until pgvector is installed
  // @Column({ type: 'vector', length: 1536, nullable: true })
  // embedding: number[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if sale is active
  get isActive(): boolean {
    const now = new Date();
    return (
      this.status === SaleStatus.ACTIVE &&
      this.startDate <= now &&
      this.endDate >= now
    );
  }
}
