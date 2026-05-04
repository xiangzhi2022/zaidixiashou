import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidation } from './config/env.validation.js';
import { HealthModule } from './modules/health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PlatformAccountsModule } from './modules/platform-accounts/platform-accounts.module.js';
import { CommerceModule } from './modules/commerce/commerce.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { CreativeModule } from './modules/creative/creative.module.js';
import { ApprovalsModule } from './modules/approvals/approvals.module.js';
import { AutomationsModule } from './modules/automations/automations.module.js';
import { ConnectorsModule } from './modules/connectors/connectors.module.js';
import { AiCommandModule } from './modules/ai-command/ai-command.module.js';
import { AuditModule } from './modules/audit/audit.module.js';
import { PrismaModule } from './infrastructure/prisma/prisma.module.js';
import { RedisModule } from './infrastructure/redis/redis.module.js';
import { QueueModule } from './infrastructure/queue/queue.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: envValidation }),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PlatformAccountsModule,
    CommerceModule,
    MediaModule,
    CreativeModule,
    ApprovalsModule,
    AutomationsModule,
    ConnectorsModule,
    AiCommandModule,
    AuditModule
  ]
})
export class AppModule {}

