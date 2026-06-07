import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inventory } from './inventory.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(Inventory) private repo: Repository<Inventory>,
    private usersService: UsersService,
  ) {}

  findByUser(userId: number) {
    return this.repo.find({
      where: { user: { id: userId }, isSold: false },
      relations: ['item'],
      order: { obtainedAt: 'DESC' },
    });
  }

  async addItem(userId: number, itemId: number): Promise<Inventory> {
    const inv = this.repo.create({
      user: { id: userId } as any,
      item: { id: itemId } as any,
    });
    return this.repo.save(inv);
  }

  async sellItem(invId: number, userId: number) {
    const inv = await this.repo.findOne({
      where: { id: invId },
      relations: ['user', 'item'],
    });
    if (!inv) throw new NotFoundException('Предмет не найден в инвентаре');
    if (inv.user.id !== userId) throw new ForbiddenException('Это не ваш предмет');
    if (inv.isSold) throw new ForbiddenException('Предмет уже продан');

    inv.isSold = true;
    await this.repo.save(inv);
    await this.usersService.updateBalance(userId, Number(inv.item.value));
    return { message: 'Предмет продан', earned: inv.item.value };
  }
}
