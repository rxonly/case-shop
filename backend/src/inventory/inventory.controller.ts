import { Controller, Get, Post, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('inventory')
@UseGuards(JwtAuthGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findMine(@Request() req) {
    return this.inventoryService.findByUser(req.user.id);
  }

  @Post(':id/sell')
  sellItem(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.inventoryService.sellItem(id, req.user.id);
  }
}
