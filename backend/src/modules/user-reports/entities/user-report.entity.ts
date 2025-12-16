import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

export enum ReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

@Entity('user_reports')
export class UserReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  saleId: string;

  @ManyToOne(() => Sale, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @Column()
  imageUrl: string;

  @Column({ type: 'jsonb' })
  rawData: {
    title?: string;
    description?: string;
    category?: string;
    discountPercentage?: number;
    originalPrice?: number;
    salePrice?: number;
    storeId?: string;
    storeName?: string;
  };

  @Column({ type: 'jsonb', nullable: true })
  aiExtractedData: {
    title?: string;
    description?: string;
    category?: string;
    discountPercentage?: number;
    originalPrice?: number;
    salePrice?: number;
    brand?: string;
    confidence?: number;
  };

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ nullable: true })
  verifiedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verifiedBy' })
  verifier: User;

  @Column({ nullable: true })
  verificationNote: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  location: string;

  @Column({ default: 0 })
  pointsAwarded: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
