import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  planId!: string;
}

export class UpdateSubscriptionDto {
  @IsString()
  @IsOptional()
  planId?: string;
}

export class GetSubscriptionStatsDto {
  @IsOptional()
  @IsString()
  teamId?: string;
}
