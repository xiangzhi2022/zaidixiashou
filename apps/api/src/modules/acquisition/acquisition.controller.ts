import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AcquisitionService } from './acquisition.service.js';
import { CreateAcquisitionTaskDto, UpdateAcquisitionTaskDto, CreateCampaignDto, UpdateCampaignDto } from './dto/acquisition.dto.js';
import { AcquisitionTaskStatus, LeadStatus } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('获客')
@Controller('acquisition')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AcquisitionController {
  constructor(private readonly acquisitionService: AcquisitionService) {}

  // ===== Stats =====
  @Get('stats')
  @ApiOperation({ summary: '获客统计概览' })
  async getStats(@Req() req: { user: { id: string; teamId?: string } }) {
    return this.acquisitionService.getStats(req.user.teamId || 'team_local');
  }

  // ===== Tasks =====
  @Post('tasks')
  @ApiOperation({ summary: '创建获客任务' })
  async createTask(@Req() req: { user: { id: string; teamId?: string } }, @Body() dto: CreateAcquisitionTaskDto) {
    return this.acquisitionService.createTask(req.user.teamId || 'team_local', dto);
  }

  @Get('tasks')
  @ApiOperation({ summary: '获取获客任务列表' })
  async getTasks(
    @Req() req: { user: { id: string; teamId?: string } },
    @Query('status') status?: AcquisitionTaskStatus,
  ) {
    return this.acquisitionService.getTasks(req.user.teamId || 'team_local', status);
  }

  @Put('tasks/:id')
  @ApiOperation({ summary: '更新获客任务' })
  async updateTask(
    @Req() req: { user: { id: string; teamId?: string } },
    @Param('id') id: string,
    @Body() dto: UpdateAcquisitionTaskDto,
  ) {
    return this.acquisitionService.updateTask(id, req.user.teamId || 'team_local', dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: '删除获客任务' })
  async deleteTask(@Req() req: { user: { id: string; teamId?: string } }, @Param('id') id: string) {
    return this.acquisitionService.deleteTask(id, req.user.teamId || 'team_local');
  }

  // ===== Prospects =====
  @Get('prospects')
  @ApiOperation({ summary: '获取潜客列表' })
  async getProspects(
    @Req() req: { user: { id: string; teamId?: string } },
    @Query('platform') platform?: string,
    @Query('status') status?: LeadStatus,
    @Query('minScore') minScore?: number,
  ) {
    return this.acquisitionService.getProspects(req.user.teamId || 'team_local', {
      platform,
      status,
      minScore: minScore ? Number(minScore) : undefined,
    });
  }

  @Put('prospects/:id/status')
  @ApiOperation({ summary: '更新潜客状态' })
  async updateLeadStatus(
    @Req() req: { user: { id: string; teamId?: string } },
    @Param('id') id: string,
    @Body() body: { status: LeadStatus },
  ) {
    return this.acquisitionService.updateLeadStatus(id, req.user.teamId || 'team_local', body.status);
  }

  // ===== Campaigns =====
  @Post('campaigns')
  @ApiOperation({ summary: '创建触达活动' })
  async createCampaign(
    @Req() req: { user: { id: string; teamId?: string } },
    @Body() dto: CreateCampaignDto,
  ) {
    return this.acquisitionService.createCampaign(req.user.teamId || 'team_local', req.user.id, dto);
  }

  @Get('campaigns')
  @ApiOperation({ summary: '获取触达活动列表' })
  async getCampaigns(
    @Req() req: { user: { id: string; teamId?: string } },
    @Query('status') status?: AcquisitionTaskStatus,
  ) {
    return this.acquisitionService.getCampaigns(req.user.teamId || 'team_local', status);
  }

  @Put('campaigns/:id')
  @ApiOperation({ summary: '更新触达活动' })
  async updateCampaign(
    @Req() req: { user: { id: string; teamId?: string } },
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
  ) {
    return this.acquisitionService.updateCampaign(id, req.user.teamId || 'team_local', dto);
  }

  @Post('campaigns/:id/submit-approval')
  @ApiOperation({ summary: '提交触达活动审批' })
  async submitApproval(
    @Req() req: { user: { id: string; teamId?: string } },
    @Param('id') id: string,
  ) {
    return this.acquisitionService.submitCampaignForApproval(id, req.user.teamId || 'team_local', req.user.id);
  }
}
