import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { SubscriptionPlan } from '@prisma/client';

const PLAN_CONFIGS: Record<string, { aiQuota: number; cdpConcurrent: number; acquisitionTasks: number; platformApis: number }> = {
  FREE: { aiQuota: 50, cdpConcurrent: 1, acquisitionTasks: 5, platformApis: 2 },
  BASIC: { aiQuota: 500, cdpConcurrent: 3, acquisitionTasks: 50, platformApis: 5 },
  PROFESSIONAL: { aiQuota: 2000, cdpConcurrent: 10, acquisitionTasks: 200, platformApis: 10 },
  ENTERPRISE: { aiQuota: -1, cdpConcurrent: -1, acquisitionTasks: -1, platformApis: -1 },
};

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) {
      // Return free plan info
      const freeConfig = PLAN_CONFIGS['FREE']!;
      return {
        plan: SubscriptionPlan.FREE,
        status: 'ACTIVE',
        aiQuota: freeConfig.aiQuota,
        aiUsed: 0,
        cdpConcurrent: freeConfig.cdpConcurrent,
        acquisitionTasks: freeConfig.acquisitionTasks,
        platformApis: freeConfig.platformApis,
      };
    }
    const config = PLAN_CONFIGS[sub.plan] ?? PLAN_CONFIGS['FREE']!;
    return {
      ...sub,
      aiQuota: config.aiQuota,
      cdpConcurrent: config.cdpConcurrent,
      acquisitionTasks: config.acquisitionTasks,
      platformApis: config.platformApis,
    };
  }

  async listPlans() {
    return Object.entries(PLAN_CONFIGS).map(([plan, config]) => ({
      plan,
      ...config,
    }));
  }

  async getBillingHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async checkQuota(userId: string, resource: string): Promise<boolean> {
    const sub = await this.getCurrentSubscription(userId);
    const config = PLAN_CONFIGS[sub.plan as string] ?? PLAN_CONFIGS['FREE']!;

    if (resource === 'ai' && config.aiQuota !== -1) {
      const subRecord = await this.prisma.subscription.findFirst({
        where: { userId, status: 'ACTIVE' },
      });
      const used = subRecord?.aiQuotaUsed ?? 0;
      return used < config.aiQuota;
    }
    return true; // Unlimited or unknown resource
  }

  async createSubscription(userId: string, plan: SubscriptionPlan, paymentId: string) {
    const config = PLAN_CONFIGS[plan] ?? PLAN_CONFIGS['FREE']!;
    return this.prisma.subscription.create({
      data: {
        userId,
        plan,
        status: 'ACTIVE',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        aiQuotaDaily: config.aiQuota,
        aiQuotaUsed: 0,
        cdpConcurrency: config.cdpConcurrent,
        acquisitionLimit: config.acquisitionTasks,
        payments: {
          connect: { id: paymentId },
        },
      },
    });
  }
}
