import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { CreateAcquisitionTaskDto, UpdateAcquisitionTaskDto, CreateCampaignDto, UpdateCampaignDto } from './dto/acquisition.dto.js';
import { AcquisitionTaskStatus, LeadStatus } from '@prisma/client';

@Injectable()
export class AcquisitionService {
  private readonly logger = new Logger(AcquisitionService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===== Acquisition Tasks =====

  async createTask(teamId: string, dto: CreateAcquisitionTaskDto) {
    return this.prisma.acquisitionTask.create({
      data: {
        teamId,
        name: dto.name,
        platform: dto.platform,
        type: dto.type,
        keywords: dto.keywords,
        url: dto.url,
        maxResults: dto.maxResults || 100,
        status: AcquisitionTaskStatus.PENDING,
        foundCount: 0,
      },
    });
  }

  async getTasks(teamId: string, status?: AcquisitionTaskStatus) {
    const where: Record<string, unknown> = { teamId, deletedAt: null };
    if (status) where.status = status;
    return this.prisma.acquisitionTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateTask(taskId: string, teamId: string, dto: UpdateAcquisitionTaskDto) {
    const task = await this.prisma.acquisitionTask.findFirst({ where: { id: taskId, teamId } });
    if (!task) throw new NotFoundException('任务不存在');

    return this.prisma.acquisitionTask.update({
      where: { id: taskId },
      data: dto,
    });
  }

  async deleteTask(taskId: string, teamId: string) {
    const task = await this.prisma.acquisitionTask.findFirst({ where: { id: taskId, teamId } });
    if (!task) throw new NotFoundException('任务不存在');

    return this.prisma.acquisitionTask.update({
      where: { id: taskId },
      data: { deletedAt: new Date() },
    });
  }

  // ===== Prospects / Leads =====

  async getProspects(teamId: string, filters: { platform?: string; status?: LeadStatus; minScore?: number }) {
    const where: Record<string, unknown> = { teamId, deletedAt: null };
    if (filters.platform) where.platform = filters.platform;
    if (filters.status) where.status = filters.status;
    if (filters.minScore) where.intentScore = { gte: filters.minScore };

    return this.prisma.lead.findMany({
      where,
      orderBy: { intentScore: 'desc' },
      take: 100,
    });
  }

  async updateLeadStatus(leadId: string, teamId: string, status: LeadStatus) {
    const prospect = await this.prisma.lead.findFirst({ where: { id: leadId, teamId } });
    if (!prospect) throw new NotFoundException('潜客不存在');

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });
  }

  // ===== Outreach Campaigns =====

  async createCampaign(teamId: string, userId: string, dto: CreateCampaignDto) {
    return this.prisma.outreachCampaign.create({
      data: {
        teamId,
        name: dto.name,
        platform: dto.platform as any,
        messageTemplate: dto.messageTemplate,
        leadIds: [],
        status: AcquisitionTaskStatus.PENDING,
        sentCount: 0,
        repliedCount: 0,
        requiresApproval: true,
      },
    });
  }

  async getCampaigns(teamId: string, status?: AcquisitionTaskStatus) {
    const where: Record<string, unknown> = { teamId };
    if (status) where.status = status;
    return this.prisma.outreachCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async updateCampaign(campaignId: string, teamId: string, dto: UpdateCampaignDto) {
    const campaign = await this.prisma.outreachCampaign.findFirst({ where: { id: campaignId, teamId } });
    if (!campaign) throw new NotFoundException('触达活动不存在');

    return this.prisma.outreachCampaign.update({
      where: { id: campaignId },
      data: dto,
    });
  }

  async submitCampaignForApproval(campaignId: string, teamId: string, userId: string) {
    const campaign = await this.prisma.outreachCampaign.findFirst({ where: { id: campaignId, teamId } });
    if (!campaign) throw new NotFoundException('触达活动不存在');

    if (campaign.status !== AcquisitionTaskStatus.PENDING) {
      throw new BadRequestException('只有待处理状态的活动才能提交审批');
    }

    const approval = await this.prisma.approval.create({
      data: {
        teamId,
        requestedById: userId,
        actionType: 'OUTREACH',
        actionTitle: `发送触达活动: ${campaign.name}`,
        actionDetail: `平台: ${campaign.platform}, 预计发送: ${campaign.sentCount}条`,
        riskLevel: (campaign.sentCount as number) > 100 ? 'HIGH' : 'MEDIUM',
        status: 'PENDING',
      },
    });

    await this.prisma.outreachCampaign.update({
      where: { id: campaignId },
      data: { status: AcquisitionTaskStatus.RUNNING, requiresApproval: true },
    });

    return { campaignId, approvalId: approval.id, status: AcquisitionTaskStatus.RUNNING };
  }

  // ===== Stats =====

  async getStats(teamId: string) {
    const [totalProspects, contactedProspects, activeTasks, activeCampaigns] = await Promise.all([
      this.prisma.lead.count({ where: { teamId, deletedAt: null } }),
      this.prisma.lead.count({ where: { teamId, status: LeadStatus.CONTACTED, deletedAt: null } }),
      this.prisma.acquisitionTask.count({ where: { teamId, status: AcquisitionTaskStatus.RUNNING, deletedAt: null } }),
      this.prisma.outreachCampaign.count({ where: { teamId, status: AcquisitionTaskStatus.RUNNING } }),
    ]);

    const conversionRate = contactedProspects > 0
      ? (await this.prisma.lead.count({ where: { teamId, status: LeadStatus.CONVERTED } })) / contactedProspects * 100
      : 0;

    return {
      totalProspects,
      contactedProspects,
      conversionRate: Math.round(conversionRate * 10) / 10,
      activeTasks,
      activeCampaigns,
    };
  }
}
