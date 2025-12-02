import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  USER = 'user',
  STORE_OWNER = 'store_owner',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ nullable: true })
  avatar: string;

  // User preferences for recommendations
  @Column({ type: 'jsonb', nullable: true })
  preferences: {
    categories: string[];
    brands: string[];
    minDiscount: number;
    maxDistance: number;
    notificationEnabled: boolean;
    quietHours: { start: string; end: string };
    language: 'he' | 'en';
  };

  // Location for personalized sales
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  defaultLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  defaultLongitude: number;

  @Column({ nullable: true })
  fcmToken: string; // Firebase Cloud Messaging token

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  @Exclude()
  refreshToken: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastLoginAt: Date;
}
