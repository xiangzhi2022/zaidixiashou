import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { RedisService } from '../redis/redis.service.js';

export const QueueNames = {
  SYNC_ORDERS: 'sync.orders',
  SYNC_MEDIA_METRICS: 'sync.mediaMetrics',
  AI_GENERATE_CREATIVE: 'ai.generateCreative',
  MEDIA_PUBLISH: 'media.publish',
  APPROVAL_TIMEOUT: 'approval.timeout',
  AUTOMATION_RUN: 'automation.run'
} as const;

@Injectable()
export class QueueService implements OnModuleDestroy {
  readonly queues: Queue[];

  constructor(private readonly redis: RedisService) {
    this.queues = Object.values(QueueNames).map(
      (name) => new Queue(name, { connection: this.redis.client })
    );
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.queues.map((queue) => queue.close()));
  }
}
