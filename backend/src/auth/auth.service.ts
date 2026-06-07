import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    this.logger.log(`Попытка входа: ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`Неудачная попытка входа — email не найден: ${email}`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      this.logger.warn(`Неудачная попытка входа — неверный пароль: ${email}`);
      throw new UnauthorizedException('Неверный email или пароль');
    }

    this.logger.log(`Успешный вход: ${email} (role: ${user.role})`);
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, balance: user.balance },
    };
  }
}