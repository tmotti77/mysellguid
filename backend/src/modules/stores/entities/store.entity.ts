import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum StoreCategory {
  FASHION = 'fashion',
  ELECTRONICS = 'electronics',
  HOME = 'home',
  FOOD = 'food',
  BEAUTY = 'beauty',
  SPORTS = 'sports',
  BOOKS = 'books',
  TOYS = 'toys',
  OTHER = 'other',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: StoreCategory,
    default: StoreCategory.OTHER,
  })
  category: StoreCategory;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  coverImage: string;

  // Contact information
  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  instagramHandle: string;

  @Column({ nullable: true })
  facebookPage: string;

  // Address
  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ default: 'Israel' })
  country: string;

  // Geospatial - using PostGIS POINT type
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: string; // Stored as WKT: POINT(longitude latitude)

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  // Opening hours (JSON object)
  @Column({ type: 'jsonb', nullable: true })
  openingHours: {
    monday?: { open: string; close: string };
    tuesday?: { open: string; close: string };
    wednesday?: { open: string; close: string };
    thursday?: { open: string; close: string };
    friday?: { open: string; close: string };
    saturday?: { open: string; close: string };
    sunday?: { open: string; close: string };
  };

  // Store owner
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  owner: User;

  @Column({ nullable: true })
  ownerId: string;

  // Verification status
  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  // Statistics
  @Column({ default: 0 })
  totalSales: number;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
