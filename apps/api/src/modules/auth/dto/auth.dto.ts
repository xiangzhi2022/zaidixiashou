import { IsEmail, IsOptional, IsString, IsEnum, MinLength } from 'class-validator';
import { LoginMethod, QRCodeType } from '@prisma/client';

export class SmsLoginDto {
  @IsString()
  phone!: string;

  @IsString()
  code!: string;
}

export class EmailLoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class EmailRegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsString()
  name?: string;
}

export class WechatLoginDto {
  @IsString()
  code!: string;
}

export class AlipayLoginDto {
  @IsString()
  code!: string;
}

export class QRCodeGenerateDto {
  @IsEnum(QRCodeType)
  type!: QRCodeType;
}

export class QRCodeStatusDto {
  @IsString()
  scene!: string;
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

export class BindAlipayDto {
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
