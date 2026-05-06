import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export enum AiProvider {
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
  CUSTOM = 'CUSTOM',
}

export class CreateAiKeyDto {
  @IsEnum(AiProvider)
  provider!: AiProvider;

  @IsString()
  endpoint!: string;

  @IsString()
  apiKey!: string;

  @IsOptional()
  @IsString()
  defaultModel?: string;

  @IsOptional()
  @IsString()
  advancedModel?: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateAiKeyDto {
  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  defaultModel?: string;

  @IsOptional()
  @IsString()
  advancedModel?: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class UpdateAiConfigDto {
  @IsOptional()
  @IsString()
  apiMode?: string;

  @IsOptional()
  @IsString()
  defaultKeyRef?: string;

  @IsOptional()
  @IsString()
  defaultModel?: string;

  @IsOptional()
  @IsString()
  advancedModel?: string;

  @IsOptional()
  @IsString()
  embeddingModel?: string;

  @IsOptional()
  @IsNumber()
  maxConcurrency?: number;

  @IsOptional()
  @IsNumber()
  timeoutMs?: number;
}
