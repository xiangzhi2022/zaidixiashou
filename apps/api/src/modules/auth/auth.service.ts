import { Injectable, UnauthorizedException, Logger, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { SmsLoginDto, WechatLoginDto, EmailLoginDto, EmailRegisterDto } from './dto/auth.dto.js';
import { QRCodeType } from '@prisma/client';

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
    const code = '888888';
    this.logger.log(`SMS code for ${phone}: ${code} (dev mode)`);
    return { success: true, message: '验证码已发送' };
  }

  /** Email password login */
  async loginByEmail(dto: EmailLoginDto) {
    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('邮箱或密码错误');
    }
    // TODO: Use bcrypt to compare password hash
    // For now, accept any password in dev mode
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return this.generateTokens(user.id, user.email ?? '');
  }

  /** Email registration */
  async registerByEmail(dto: EmailRegisterDto) {
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) {
      throw new UnauthorizedException('该邮箱已注册');
    }
    // TODO: Hash password with bcrypt
    const passwordHash = `hashed_${dto.password}`;
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name ?? `用户${dto.email.split('@')[0]}`,
        loginMethod: 'EMAIL',
        passwordHash,
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

    return this.generateTokens(user.id, user.email);
  }

  /** Alipay scan login */
  async loginByAlipay(dto: { code: string }) {
    // TODO: Integrate Alipay OAuth
    const mockAlipayId = `alipay_${dto.code}`;
    let user = await this.prisma.user.findFirst({ where: { alipayOpenId: mockAlipayId } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          alipayOpenId: mockAlipayId,
          name: `支付宝用户${mockAlipayId.slice(-4)}`,
          loginMethod: 'ALIPAY',
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
    return this.generateTokens(user.id, user.alipayOpenId ?? '');
  }

  /** Generate QR code for WeChat/Alipay login */
  async generateQRCode(type: QRCodeType) {
    // TODO: Integrate real QR code generation with WeChat/Alipay SDK
    const scene = `qr_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.logger.log(`Generated QR code scene: ${scene} for type: ${type}`);
    return {
      scene,
      type,
      expiresIn: 300, // 5 minutes
      // In production, this would include the actual QR code URL or image data
      qrCodeUrl: `https://placeholder.example.com/qr/${scene}`,
    };
  }

  /** Get QR code scan status */
  async getQRCodeStatus(scene: string) {
    // TODO: Integrate with real WeChat/Alipay callback
    // For now, return pending status
    return {
      scene,
      status: 'PENDING', // PENDING | SCANNED | CONFIRMED | EXPIRED
      message: '等待扫码',
    };
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
        memberships: {
          include: {
            team: {
              select: { id: true, name: true },
            },
          },
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          select: {
            plan: true,
            status: true,
            expiresAt: true,
            aiQuotaDaily: true,
            aiQuotaUsed: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
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
