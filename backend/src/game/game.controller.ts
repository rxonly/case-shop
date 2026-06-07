import { Controller, Post, Param, ParseIntPipe, Body, UseGuards, Request } from '@nestjs/common';
import { GameService } from './game.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsNumber, Min } from 'class-validator';

class TopUpDto {
  @IsNumber()
  @Min(1)
  amount: number;
}

@Controller('game')
@UseGuards(JwtAuthGuard)
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('open/:caseId')
  openCase(@Param('caseId', ParseIntPipe) caseId: number, @Request() req) {
    return this.gameService.openCase(req.user.id, caseId);
  }

  @Post('topup')
  topUp(@Body() dto: TopUpDto, @Request() req) {
    return this.gameService.topUp(req.user.id, dto.amount);
  }
}
