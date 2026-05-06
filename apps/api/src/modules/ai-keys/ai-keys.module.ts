import { Module } from '@nestjs/common';
import { AiKeysController } from './ai-keys.controller.js';
import { AiKeysService } from './ai-keys.service.js';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AiKeysController],
  providers: [AiKeysService],
  exports: [AiKeysService],
})
export class AiKeysModule {}
