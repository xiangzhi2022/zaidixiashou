import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod, SubscriptionPlan } from '@prisma/client';

export class CreatePaymentDto {
  @IsEnum(SubscriptionPlan)
  plan!: SubscriptionPlan;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}

export class PaymentCallbackDto {
  @IsString()
  outTradeNo!: string;

  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsNumber()
  @Min(1)
  totalAmount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}
