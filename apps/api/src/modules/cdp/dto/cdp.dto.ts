import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ConnectBrowserDto {
  @IsNumber()
  @IsOptional()
  port?: number;

  @IsString()
  @IsOptional()
  host?: string;
}

export class NavigateDto {
  @IsString()
  url!: string;

  @IsNumber()
  @IsOptional()
  tabId?: number;
}

export class ExecuteScriptDto {
  @IsString()
  script!: string;

  @IsNumber()
  @IsOptional()
  tabId?: number;
}

export class ScreenshotDto {
  @IsNumber()
  @IsOptional()
  tabId?: number;

  @IsString()
  @IsOptional()
  format?: 'png' | 'jpeg';
}
