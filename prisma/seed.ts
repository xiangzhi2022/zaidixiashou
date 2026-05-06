import {
  AccountStatus, AiKeyProvider, AiKeyStatus, AuthType,
  AcquisitionTaskStatus, AcquisitionTaskType, CdpSessionStatus,
  LeadStatus, LoginMethod, PaymentMethod, PaymentStatus,
  Platform, PrismaClient, RiskLevel, SubscriptionPlan,
  SubscriptionStatus, UserRole
} from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // ── User ──
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.local' },
    update: {},
    create: {
      email: 'admin@example.local',
      phone: '13800138000',
      name: 'Local Admin',
      passwordHash: '$2b$10$dummy.hash.for.dev.only',
      avatarUrl: null,
      wechatOpenId: null,
      loginMethod: LoginMethod.SMS,
      lastLoginAt: new Date()
    }
  });

  // ── Team ──
  const team = await prisma.team.upsert({
    where: { id: 'team_local' },
    update: {},
    create: {
      id: 'team_local',
      name: 'Local Demo Team'
    }
  });

  // ── TeamMember ──
  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: { role: UserRole.OWNER },
    create: {
      teamId: team.id,
      userId: user.id,
      role: UserRole.OWNER
    }
  });

  // ── Subscription ──
  const existingSub = await prisma.subscription.findFirst({ where: { userId: user.id } });
  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: SubscriptionPlan.PROFESSIONAL,
        status: SubscriptionStatus.ACTIVE,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        aiQuotaDaily: 500,
        aiQuotaUsed: 0,
        cdpConcurrency: 3,
        acquisitionLimit: 50
      }
    });
  }

  // ── Platform Accounts ──
  const accounts = [
    { platform: Platform.SHOPIFY, displayName: 'Shopify Demo', authType: AuthType.MCP_STDIO },
    { platform: Platform.AMAZON, displayName: 'Amazon Demo', authType: AuthType.OAUTH },
    { platform: Platform.XIAOHONGSHU, displayName: '小红书主账号', authType: AuthType.CDP },
    { platform: Platform.DOUYIN, displayName: '抖音主账号', authType: AuthType.CDP },
    { platform: Platform.TIKTOK, displayName: 'TikTok Business', authType: AuthType.CDP },
    { platform: Platform.INSTAGRAM, displayName: 'Instagram Business', authType: AuthType.CDP }
  ];

  for (const account of accounts) {
    await prisma.platformAccount.upsert({
      where: {
        teamId_platform_displayName: {
          teamId: team.id,
          platform: account.platform,
          displayName: account.displayName
        }
      },
      update: {},
      create: {
        teamId: team.id,
        platform: account.platform,
        displayName: account.displayName,
        authType: account.authType,
        status: AccountStatus.PENDING_AUTH
      }
    });
  }

  // ── CDP Session ──
  await prisma.cdpSession.upsert({
    where: { teamId: team.id },
    update: {},
    create: {
      teamId: team.id,
      status: CdpSessionStatus.DISCONNECTED,
      debugPort: 9222
    }
  });

  // ── Risk Rules ──
  for (const actionType of ['media.publish', 'media.bulk_message', 'commerce.refund', 'commerce.price_update']) {
    const existing = await prisma.riskRule.findFirst({
      where: { teamId: team.id, actionType }
    });
    if (existing) continue;

    await prisma.riskRule.create({
      data: {
        teamId: team.id,
        actionType,
        riskLevel: RiskLevel.HIGH,
        requiresApproval: true
      }
    });
  }

  // ── AI Key (demo) ──
  const existingKey = await prisma.aiKey.findFirst({ where: { userId: user.id } });
  if (!existingKey) {
    await prisma.aiKey.create({
      data: {
        userId: user.id,
        label: 'OpenAI GPT-4o',
        provider: AiKeyProvider.OPENAI,
        endpoint: 'https://api.openai.com/v1',
        encryptedKey: 'demo-encrypted-key',
        iv: 'demo-iv',
        authTag: 'demo-auth-tag',
        defaultModel: 'gpt-4o-mini',
        advancedModel: 'gpt-4o',
        embeddingModel: 'text-embedding-3-small',
        isDefault: true,
        status: AiKeyStatus.ACTIVE
      }
    });
  }

  // ── Acquisition Task (demo) ──
  const existingTask = await prisma.acquisitionTask.findFirst({ where: { teamId: team.id } });
  if (!existingTask) {
    const task = await prisma.acquisitionTask.create({
      data: {
        teamId: team.id,
        name: '小红书旅行收纳话题抓取',
        platform: Platform.XIAOHONGSHU,
        taskType: AcquisitionTaskType.KEYWORD_SEARCH,
        keywords: ['旅行收纳', '行李箱整理'],
        status: AcquisitionTaskStatus.COMPLETED,
        maxResults: 100,
        resultCount: 128
      }
    });

    // ── Leads (demo) ──
    const demoLeads = [
      { username: '时尚小仙女', intentScore: 92, interactionType: '收藏+评论' },
      { username: 'TechReviewer_Jay', intentScore: 75, interactionType: '点赞+关注' },
      { username: '居家生活家', intentScore: 58, interactionType: '评论' }
    ];

    for (const lead of demoLeads) {
      await prisma.lead.create({
        data: {
          taskId: task.id,
          teamId: team.id,
          platform: Platform.XIAOHONGSHU,
          username: lead.username,
          intentScore: lead.intentScore,
          interactionType: lead.interactionType,
          status: LeadStatus.NEW
        }
      });
    }
  }

  console.log('Seed data created successfully');
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
