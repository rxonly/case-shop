import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { CasesService } from '../cases/cases.service';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private casesService: CasesService,
    private inventoryService: InventoryService,
  ) {}

  async openCase(userId: number, caseId: number) {
    this.logger.log(`Пользователь #${userId} открывает кейс #${caseId}`);

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Пользователь не найден');

    const caseItem = await this.casesService.findOne(caseId);
    if (!caseItem.isActive) throw new BadRequestException('Кейс недоступен');
    if (!caseItem.items || caseItem.items.length === 0) {
      throw new BadRequestException('В кейсе нет предметов');
    }

    const price = Number(caseItem.price);
    if (Number(user.balance) < price) {
      this.logger.warn(`Пользователь #${userId} — недостаточно средств (баланс: ${user.balance}, цена: ${price})`);
      throw new BadRequestException('Недостаточно средств на балансе');
    }

    await this.usersRepo.decrement({ id: userId }, 'balance', price);

    const items = caseItem.items;
    const randomItem = items[Math.floor(Math.random() * items.length)];

    const inv = await this.inventoryService.addItem(userId, randomItem.id);
    const updatedUser = await this.usersRepo.findOne({ where: { id: userId } });

    this.logger.log(`Пользователь #${userId} выиграл предмет "${randomItem.name}" из кейса #${caseId}`);

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
    this.logger.log(`Пользователь #${userId} пополнил баланс на ${amount} ₽`);
    return { balance: user?.balance };
  }
}