import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { SmsLoginDto, WechatLoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /** SMS verification code login */
  async loginBySms(dto: SmsLoginDto) {
    // TODO: Integrate real SMS service (Aliyun/Tencent SMS)
    // For now, accept any 6-digit code in dev mode
    const isValidCode = dto.code === '888888' || dto.code.length === 6;
    if (!isValidCode) {
      throw new UnauthorizedException('验证码错误');
    }

    let user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });

    if (!user) {
      // Auto-register on first login
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          name: `用户${dto.phone.slice(-4)}`,
          loginMethod: 'SMS',
          passwordHash: '',
        },
      });

      // Create default team for new user
      const team = await this.prisma.team.create({
        data: { name: `${user.name}的团队` },
      });
      await this.prisma.teamMember.create({
        data: { teamId: team.id, userId: user.id, role: 'OWNER' },
      });

      // Create free subscription
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: new Date('2099-12-31'),
          aiQuotaDaily: 50,
          aiQuotaUsed: 0,
          cdpConcurrency: 1,
          acquisitionLimit: 10,
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.phone ?? '');
  }

  /** WeChat OAuth login */
  async loginByWechat(dto: WechatLoginDto) {
    // TODO: Integrate WeChat Open Platform OAuth
    // Exchange code for access_token + openid
    // For dev mode, create a mock user
    const mockOpenId = `wx_${dto.code}`;

    let user = await this.prisma.user.findFirst({ where: { wechatOpenId: mockOpenId } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          wechatOpenId: mockOpenId,
          name: `微信用户${mockOpenId.slice(-4)}`,
          loginMethod: 'WECHAT',
          passwordHash: '',
        },
      });

      const team = await this.prisma.team.create({
        data: { name: `${user.name}的团队` },
      });
      await this.prisma.teamMember.create({
        data: { teamId: team.id, userId: user.id, role: 'OWNER' },
      });

      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: new Date('2099-12-31'),
          aiQuotaDaily: 50,
          aiQuotaUsed: 0,
          cdpConcurrency: 1,
          acquisitionLimit: 10,
        },
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return this.generateTokens(user.id, user.phone ?? user.wechatOpenId ?? '');
  }

  /** Send SMS verification code */
  async sendSmsCode(phone: string) {
    // TODO: Integrate real SMS service
    // For dev, just log the code
    const code = '888888';
    this.logger.log(`SMS code for ${phone}: ${code} (dev mode)`);
    return { success: true, message: '验证码已发送' };
  }

  /** Get current user profile */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        name: true,
        avatarUrl: true,
        loginMethod: true,
        createdAt: true,
        teams: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
        subscription: {
          select: {
            plan: true,
            status: true,
            expiresAt: true,
            aiQuotaDaily: true,
            aiQuotaUsed: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }

  private generateTokens(userId: string, identifier: string) {
    const payload = { sub: userId, identifier };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600 * 24, // 24h
    };
  }
}
