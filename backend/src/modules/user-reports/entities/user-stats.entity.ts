import {
  Entity,
  Column,
  PrimaryColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum TrustLevel {
  NEW = 'new',
  REGULAR = 'regular',
  TRUSTED = 'trusted',
  EXPERT = 'expert',
}

@Entity('user_stats')
export class UserStats {
  @PrimaryColumn()
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ default: 0 })
  reportCount: number;

  @Column({ default: 0 })
  approvedCount: number;

  @Column({ default: 0 })
  rejectedCount: number;

  @Column({ default: 0 })
  points: number;

  @Column({ type: 'jsonb', default: [] })
  badges: string[];

  @Column({
    type: 'enum',
    enum: TrustLevel,
    default: TrustLevel.NEW,
  })
  trustLevel: TrustLevel;

  @Column({ nullable: true })
  lastReportAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
