import { Entity, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Sale } from '../../sales/entities/sale.entity';

@Entity('bookmarks')
export class Bookmark {
  @PrimaryColumn('uuid')
  userId: string;

  @PrimaryColumn('uuid')
  saleId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Sale, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale;

  @CreateDateColumn()
  createdAt: Date;
}
