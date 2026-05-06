import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@ai-commerce-ops/shared';

@Controller('health')
export class HealthController {
  @Get()
  health(): HealthResponse {
    return { status: 'ok' };
  }
}

