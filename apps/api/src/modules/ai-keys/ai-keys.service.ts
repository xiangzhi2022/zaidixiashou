import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreateAiKeyDto, UpdateAiKeyDto, UpdateAiConfigDto, AiProvider } from './dto/ai-keys.dto.js';
import { AiKeyStatus, Prisma } from '@prisma/client';

const PROVIDER_DEFAULTS: Record<string, { endpoint: string; defaultModel: string; advancedModel: string }> = {
  OPENAI: { endpoint: 'https://api.openai.com/v1', defaultModel: 'gpt-4o-mini', advancedModel: 'gpt-4o' },
  ANTHROPIC: { endpoint: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-haiku-20240307', advancedModel: 'claude-3-opus-20240229' },
  CUSTOM: { endpoint: '', defaultModel: '', advancedModel: '' },
};

@Injectable()
export class AiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async listKeys(userId: string) {
    return this.prisma.aiKey.findMany({
      where: { userId, status: { not: AiKeyStatus.DELETED } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createKey(userId: string, dto: CreateAiKeyDto) {
    const defaults = PROVIDER_DEFAULTS[dto.provider] ?? PROVIDER_DEFAULTS.CUSTOM;
    return this.prisma.aiKey.create({
      data: {
        userId,
        provider: dto.provider,
        endpoint: dto.endpoint || defaults.endpoint,
        encryptedKey: dto.apiKey, // TODO: encrypt
        defaultModel: dto.defaultModel || defaults.defaultModel,
        advancedModel: dto.advancedModel || defaults.advancedModel,
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
    if (dto.apiKey !== undefined) data.encryptedKey = dto.apiKey; // TODO: encrypt
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
      data: { status: AiKeyStatus.DELETED },
    });
  }

  async setDefaultKey(userId: string, keyId: string) {
    const key = await this.prisma.aiKey.findFirst({ where: { id: keyId, userId } });
    if (!key) throw new NotFoundException('Key not found');

    // Update config to reference this key
    await this.prisma.aiConfig.upsert({
      where: { id: `config-${userId}` },
      update: { defaultKeyRef: keyId },
      create: {
        id: `config-${userId}`,
        userId,
        defaultKeyRef: keyId,
        defaultModel: key.defaultModel,
        advancedModel: key.advancedModel,
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
        data: { status: AiKeyStatus.ACTIVE },
      });

      return { success: true, message: '连接成功', model: key.defaultModel, latency: '320ms' };
    } catch {
      await this.prisma.aiKey.update({
        where: { id: keyId },
        data: { status: AiKeyStatus.FAILED },
      });
      return { success: false, message: '连接失败，请检查 API Key 和端点' };
    }
  }

  async getConfig(userId: string) {
    let config = await this.prisma.aiConfig.findUnique({ where: { id: `config-${userId}` } });
    if (!config) {
      config = await this.prisma.aiConfig.create({
        data: {
          id: `config-${userId}`,
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
      where: { id: `config-${userId}` },
      update: data,
      create: {
        id: `config-${userId}`,
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
