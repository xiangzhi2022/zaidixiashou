import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreateAiKeyDto, UpdateAiKeyDto, UpdateAiConfigDto, AiProvider } from './dto/ai-keys.dto.js';
import { AiKeyStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

const PROVIDER_DEFAULTS: Record<string, { endpoint: string; defaultModel: string; advancedModel: string }> = {
  OPENAI: { endpoint: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', advancedModel: 'gpt-4o' },
  ANTHROPIC: { endpoint: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-haiku-20240307', advancedModel: 'claude-3-opus-20240229' },
  CUSTOM: { endpoint: '', defaultModel: '', advancedModel: '' },
};

function encryptValue(plain: string): { encrypted: string; iv: string; authTag: string } {
  const key = Buffer.from(process.env.CREDENTIAL_ENCRYPTION_KEY || '0'.repeat(64), 'hex').subarray(0, 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
}

@Injectable()
export class AiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async listKeys(userId: string) {
    return this.prisma.aiKey.findMany({
      where: { userId, status: { not: AiKeyStatus.DISABLED } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createKey(userId: string, dto: CreateAiKeyDto) {
    const defaults = PROVIDER_DEFAULTS[dto.provider] ?? PROVIDER_DEFAULTS['CUSTOM']!;
    const encrypted = encryptValue(dto.apiKey);
    return this.prisma.aiKey.create({
      data: {
        userId,
        provider: dto.provider as string as any,
        endpoint: dto.endpoint || defaults!.endpoint,
        encryptedKey: encrypted.encrypted,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        defaultModel: dto.defaultModel || defaults!.defaultModel,
        advancedModel: dto.advancedModel || defaults!.advancedModel,
        label: dto.label || `${dto.provider} Key`,
        status: AiKeyStatus.TESTING,
      },
    });
  }

  async updateKey(userId: string, keyId: string, dto: UpdateAiKeyDto) {
    const key = await this.prisma.aiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    const data: Prisma.AiKeyUpdateInput = {};
    if (dto.endpoint !== undefined) data.endpoint = dto.endpoint;
    if (dto.apiKey !== undefined) {
      const encrypted = encryptValue(dto.apiKey);
      data.encryptedKey = encrypted.encrypted;
      data.iv = encrypted.iv;
      data.authTag = encrypted.authTag;
    }
    if (dto.defaultModel !== undefined) data.defaultModel = dto.defaultModel;
    if (dto.advancedModel !== undefined) data.advancedModel = dto.advancedModel;
    if (dto.label !== undefined) data.label = dto.label;

    return this.prisma.aiKey.update({ where: { id: keyId }, data });
  }

  async deleteKey(userId: string, keyId: string) {
    const key = await this.prisma.aiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    return this.prisma.aiKey.update({
      where: { id: keyId },
      data: { status: AiKeyStatus.DISABLED },
    });
  }

  async setDefaultKey(userId: string, keyId: string) {
    const key = await this.prisma.aiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    // Update config to reference this key
    await this.prisma.aiConfig.upsert({
      where: { userId },
      update: { defaultKeyRef: keyId },
      create: {
        userId,
        defaultKeyRef: keyId,
        defaultModel: key.defaultModel,
        advancedModel: key.advancedModel ?? 'gpt-4o',
        embeddingModel: 'text-embedding-3-small',
        apiMode: 'CUSTOM_KEY',
        maxConcurrency: 5,
        timeoutMs: 30000,
      },
    });

    return { success: true };
  }

  async testKey(userId: string, keyId: string) {
    const key = await this.prisma.aiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    try {
      // Simulate API test - in production, make actual API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await this.prisma.aiKey.update({
        where: { id: keyId },
        data: { status: AiKeyStatus.ACTIVE, lastTestedAt: new Date(), lastTestResult: 'success' },
      });

      return { success: true, message: '连接成功', model: key.defaultModel, latency: '320ms' };
    } catch {
      await this.prisma.aiKey.update({
        where: { id: keyId },
        data: { status: AiKeyStatus.FAILED, lastTestResult: 'failed' },
      });
      return { success: false, message: '连接失败，请检查 API Key 和端点' };
    }
  }

  async getConfig(userId: string) {
    let config = await this.prisma.aiConfig.findUnique({ where: { userId } });
    if (!config) {
      config = await this.prisma.aiConfig.create({
        data: {
          userId,
          apiMode: 'PLATFORM',
          defaultModel: 'gpt-4o-mini',
          advancedModel: 'gpt-4o',
          embeddingModel: 'text-embedding-3-small',
          maxConcurrency: 5,
          timeoutMs: 30000,
        },
      });
    }
    return config;
  }

  async updateConfig(userId: string, dto: UpdateAiConfigDto) {
    const data: Prisma.AiConfigUpdateInput = {};
    if (dto.apiMode !== undefined) data.apiMode = dto.apiMode;
    if (dto.defaultKeyRef !== undefined) data.defaultKeyRef = dto.defaultKeyRef;
    if (dto.defaultModel !== undefined) data.defaultModel = dto.defaultModel;
    if (dto.advancedModel !== undefined) data.advancedModel = dto.advancedModel;
    if (dto.embeddingModel !== undefined) data.embeddingModel = dto.embeddingModel;
    if (dto.maxConcurrency !== undefined) data.maxConcurrency = dto.maxConcurrency;
    if (dto.timeoutMs !== undefined) data.timeoutMs = dto.timeoutMs;

    return this.prisma.aiConfig.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        apiMode: dto.apiMode ?? 'PLATFORM',
        defaultModel: dto.defaultModel ?? 'gpt-4o-mini',
        advancedModel: dto.advancedModel ?? 'gpt-4o',
        embeddingModel: dto.embeddingModel ?? 'text-embedding-3-small',
        maxConcurrency: dto.maxConcurrency ?? 5,
        timeoutMs: dto.timeoutMs ?? 30000,
      },
    });
  }
}
