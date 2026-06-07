import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { CasesModule } from '../cases/cases.module';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), CasesModule, InventoryModule],
  providers: [GameService],
  controllers: [GameController],
})
export class GameModule {}
