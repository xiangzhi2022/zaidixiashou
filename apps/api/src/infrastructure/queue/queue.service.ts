import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service.js';

export const QueueNames = {
  SYNC_ORDERS: 'sync.orders',
  SYNC_MEDIA_METRICS: 'sync.mediaMetrics',
  AI_GENERATE_CREATIVE: 'ai.generateCreative',
  MEDIA_PUBLISH: 'media.publish',
  APPROVAL_TIMEOUT: 'approval.timeout',
  AUTOMATION_RUN: 'automation.run'
} as const;

// Mock Queue 实现
class MockQueue {
  name: string;
  private jobs: Map<string, any> = new Map();

  constructor(name: string) {
    this.name = name;
  }

  async add(name: string, data: any): Promise<any> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.jobs.set(jobId, { id: jobId, name, data, progress: 0 });
    console.log(`[MockQueue] ${this.name}: Added job ${name}`);
    return { id: jobId };
  }

  async getJob(id: string): Promise<any> {
    return this.jobs.get(id);
  }

  async close(): Promise<void> {
    console.log(`[MockQueue] ${this.name}: Closed`);
  }

  on(event: string, callback: Function): this {
    return this;
  }
}

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  readonly queues: any[] = [];
  private useMock = false;

  constructor(private readonly redis?: RedisService) {
    // 检查是否使用 mock Redis
    if (redis && (redis as any).useMock) {
      this.useMock = true;
      this.logger.warn('使用 Mock Queue 模式');
    } else {
      // 正常模式需要 BullMQ，这里暂时跳过
      this.logger.warn('Queue 功能暂时不可用（需要 Redis）');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all(this.queues.map((queue) => queue.close()));
  }

  // Mock addJob 方法
  async addJob(queueName: string, jobName: string, data: any): Promise<any> {
    if (this.useMock) {
      const mockQueue = new MockQueue(queueName);
      return mockQueue.add(jobName, data);
    }
    return null;
  }
}
