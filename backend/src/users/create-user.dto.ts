import {
  IsEmail, IsNotEmpty, IsString, IsOptional,
  IsInt, Min, Max, MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty({ message: 'Имя обязательно для заполнения' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Email обязателен для заполнения' })
  @IsEmail({}, { message: 'Email должен быть валидным адресом' })
  email: string;

  @IsNotEmpty({ message: 'Пароль обязателен для заполнения' })
  @MinLength(6, { message: 'Пароль должен быть минимум 6 символов' })
  password: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Возраст должен быть целым числом' })
  @Min(0)
  @Max(150)
  age?: number;
}
