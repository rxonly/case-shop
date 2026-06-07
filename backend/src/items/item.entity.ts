import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, OneToMany } from 'typeorm';
import { Case } from '../cases/case.entity';
import { Inventory } from '../inventory/inventory.entity';

export enum ItemRarity {
  COMMON = 'common',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: ItemRarity, default: ItemRarity.COMMON })
  rarity: ItemRarity;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'decimal', default: 0 })
  value: number;

  @ManyToMany(() => Case, (c) => c.items)
  cases: Case[];

  @OneToMany(() => Inventory, (inv) => inv.item)
  inventory: Inventory[];
}
