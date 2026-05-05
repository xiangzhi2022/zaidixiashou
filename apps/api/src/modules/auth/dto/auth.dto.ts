import { IsEmail, IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { LoginMethod } from '@prisma/client';

export class SmsLoginDto {
  @IsString()
  phone!: string;

  @IsString()
  code!: string;
}

export class WechatLoginDto {
  @IsString()
  code!: string;
}

export class RegisterDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  code!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class BindWechatDto {
  @IsString()
  code!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
