import {
  Injectable, ConflictException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { CreateUserDto } from './create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.usersRepo.find();
  }

  async findOne(id: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`Пользователь с id=${id} не найден`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const exists = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Пользователь с таким email уже существует');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepo.create({ ...dto, password: hashed });
    const saved = await this.usersRepo.save(user);
    const { password, ...result } = saved;
    return result;
  }

  async updateBalance(id: number, amount: number): Promise<void> {
    await this.usersRepo.increment({ id }, 'balance', amount);
  }
}
