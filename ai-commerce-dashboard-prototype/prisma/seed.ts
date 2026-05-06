import { AccountStatus, AuthType, Platform, PrismaClient, RiskLevel, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.local' },
    update: {},
    create: {
      email: 'admin@example.local',
      name: 'Local Admin',
      passwordHash: 'local-dev-password-hash'
    }
  });

  const team = await prisma.team.upsert({
    where: { id: 'team_local' },
    update: {},
    create: {
      id: 'team_local',
      name: 'Local Demo Team'
    }
  });

  await prisma.teamMember.upsert({
    where: { teamId_userId: { teamId: team.id, userId: user.id } },
    update: { role: UserRole.OWNER },
    create: {
      teamId: team.id,
      userId: user.id,
      role: UserRole.OWNER
    }
  });

  const accounts = [
    { platform: Platform.SHOPIFY, displayName: 'Shopify Demo', authType: AuthType.MCP_STDIO },
    { platform: Platform.AMAZON, displayName: 'Amazon Demo', authType: AuthType.OAUTH },
    { platform: Platform.XIAOHONGSHU, displayName: '小红书主账号', authType: AuthType.COOKIE },
    { platform: Platform.INSTAGRAM, displayName: 'Instagram Business', authType: AuthType.OAUTH }
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
