import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AcquisitionTaskStatus, AcquisitionTaskType, LeadStatus } from '@prisma/client';

export class CreateAcquisitionTaskDto {
  @IsString()
  name!: string;

  @IsString()
  platform!: string;

  @IsEnum(AcquisitionTaskType)
  type!: AcquisitionTaskType;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxResults?: number;
}

export class UpdateAcquisitionTaskDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(AcquisitionTaskStatus)
  @IsOptional()
  status?: AcquisitionTaskStatus;
}

export class CreateCampaignDto {
  @IsString()
  name!: string;

  @IsString()
  platform!: string;

  @IsString()
  messageTemplate!: string;

  @IsString()
  @IsOptional()
  prospectFilter?: string;

  @IsNumber()
  @IsOptional()
  maxSendCount?: number;
}

export class UpdateCampaignDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  messageTemplate?: string;

  @IsEnum(AcquisitionTaskStatus)
  @IsOptional()
  status?: AcquisitionTaskStatus;
}
