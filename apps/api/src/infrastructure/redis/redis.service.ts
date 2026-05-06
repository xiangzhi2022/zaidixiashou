import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import Redis from 'ioredis';

// 内存存储 Map，替代 Redis
const mockRedis = new Map<string, { value: string; expiry?: number }>();

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private useMock = true;
  private client: Redis | null = null;

  constructor() {
    // 直接使用 mock 模式，不尝试连接 Redis
    this.useMock = true;
    this.logger.warn('Redis 不可用，使用内存存储模式');
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // ignore
      }
    }
  }

  // Mock Redis 方法
  async get(key: string): Promise<string | null> {
    if (this.useMock) {
      const item = mockRedis.get(key);
      if (!item) return null;
      if (item.expiry && Date.now() > item.expiry) {
        mockRedis.delete(key);
        return null;
      }
      return item.value;
    }
    return this.client!.get(key);
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<'OK'> {
    if (this.useMock) {
      const expiry = mode === 'EX' && duration ? Date.now() + duration * 1000 : undefined;
      mockRedis.set(key, { value, expiry });
      return 'OK';
    }
    return this.client!.set(key, value, mode as any, duration as any);
  }

  async del(key: string): Promise<number> {
    if (this.useMock) {
      return mockRedis.delete(key) ? 1 : 0;
    }
    return this.client!.del(key);
  }

  async exists(key: string): Promise<number> {
    if (this.useMock) {
      const item = mockRedis.get(key);
      if (!item) return 0;
      if (item.expiry && Date.now() > item.expiry) {
        mockRedis.delete(key);
        return 0;
      }
      return 1;
    }
    return this.client!.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (this.useMock) {
      const item = mockRedis.get(key);
      if (!item) return 0;
      item.expiry = Date.now() + seconds * 1000;
      return 1;
    }
    return this.client!.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    if (this.useMock) {
      const item = mockRedis.get(key);
      if (!item) return -2;
      if (!item.expiry) return -1;
      return Math.max(0, Math.floor((item.expiry - Date.now()) / 1000));
    }
    return this.client!.ttl(key);
  }
}
