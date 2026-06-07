import { Entity, PrimaryGeneratedColumn, ManyToOne, CreateDateColumn, Column } from 'typeorm';
import { User } from '../users/user.entity';
import { Item } from '../items/item.entity';

@Entity('inventory')
export class Inventory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.inventory, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Item, (i) => i.inventory, { eager: true, onDelete: 'CASCADE' })
  item: Item;

  @CreateDateColumn()
  obtainedAt: Date;

  @Column({ default: false })
  isSold: boolean;
}
