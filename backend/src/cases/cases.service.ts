import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Case } from './case.entity';
import { IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateCaseDto {
  @IsNotEmpty() name: string;
  @IsOptional() description?: string;
  @IsNumber() price: number;
  @IsOptional() imageUrl?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() itemIds?: number[];
}

@Injectable()
export class CasesService {
  constructor(@InjectRepository(Case) private repo: Repository<Case>) {}

  findAll() {
    return this.repo.find({ where: { isActive: true } });
  }

  findAllAdmin() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException('Кейс не найден');
    return c;
  }

  async create(dto: CreateCaseDto) {
    const { itemIds, ...rest } = dto;
    const c = this.repo.create(rest);
    return this.repo.save(c);
  }

  async update(id: number, dto: Partial<CreateCaseDto>) {
    await this.findOne(id);
    const { itemIds, ...rest } = dto;
    await this.repo.update(id, rest);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: 'Кейс удалён' };
  }
}
