import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CasesService } from '../cases/cases.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private casesService: CasesService,
    private inventoryService: InventoryService,
  ) {}

  async openCase(userId: number, caseId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const caseItem = await this.casesService.findOne(caseId);
    if (!caseItem.isActive) throw new BadRequestException('Кейс недоступен');
    if (!caseItem.items || caseItem.items.length === 0) {
      throw new BadRequestException('В кейсе нет предметов');
    }

    const price = Number(caseItem.price);
    if (Number(user.balance) < price) {
      throw new BadRequestException('Недостаточно средств на балансе');
    }

    // Списываем баланс
    await this.usersRepo.decrement({ id: userId }, 'balance', price);

    // Случайный выбор предмета
    const items = caseItem.items;
    const randomItem = items[Math.floor(Math.random() * items.length)];

    // Добавляем в инвентарь
    const inv = await this.inventoryService.addItem(userId, randomItem.id);

    // Обновлённый баланс
    const updatedUser = await this.usersRepo.findOne({ where: { id: userId } });

    return {
      item: randomItem,
      balance: updatedUser?.balance,
      inventoryId: inv.id,
    };
  }

  async topUp(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestException('Сумма должна быть положительной');
    await this.usersRepo.increment({ id: userId }, 'balance', amount);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    return { balance: user?.balance };
  }
}
