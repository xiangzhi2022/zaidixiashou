import { Module } from '@nestjs/common';
import { CdpController } from './cdp.controller.js';
import { CdpService } from './cdp.service.js';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CdpController],
  providers: [CdpService],
  exports: [CdpService],
})
export class CdpModule {}
