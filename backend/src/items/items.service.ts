import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from './item.entity';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { ItemRarity } from './item.entity';

export class CreateItemDto {
  @IsNotEmpty() name: string;
  @IsEnum(ItemRarity) rarity: ItemRarity;
  @IsOptional() @IsString() imageUrl?: string;
  @IsNumber() value: number;
}

@Injectable()
export class ItemsService {
  constructor(@InjectRepository(Item) private repo: Repository<Item>) {}

  findAll() { return this.repo.find(); }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Предмет не найден');
    return item;
  }

  create(dto: CreateItemDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: number, dto: Partial<CreateItemDto>) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: 'Предмет удалён' };
  }
}
