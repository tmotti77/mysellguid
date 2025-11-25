import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('user_saved_sales')
@Index(['userId', 'saleId'], { unique: true }) // Prevent duplicate saves
export class UserSavedSale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  saleId: string;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @CreateDateColumn()
  savedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    notes?: string; // User's personal notes about the sale
    reminder?: Date; // Optional reminder date
  };
}
