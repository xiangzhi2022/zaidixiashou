import { Module } from '@nestjs/common';
import { AcquisitionController } from './acquisition.controller.js';
import { AcquisitionService } from './acquisition.service.js';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AcquisitionController],
  providers: [AcquisitionService],
  exports: [AcquisitionService],
})
export class AcquisitionModule {}
