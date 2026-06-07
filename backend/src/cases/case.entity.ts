import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { Item } from '../items/item.entity';

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal' })
  price: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Item, (item) => item.cases, { eager: true })
  @JoinTable({
    name: 'case_items',
    joinColumn: { name: 'case_id' },
    inverseJoinColumn: { name: 'item_id' },
  })
  items: Item[];
}
