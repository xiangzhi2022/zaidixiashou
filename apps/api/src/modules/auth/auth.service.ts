import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { 
  SmsLoginDto, 
  WechatLoginDto, 
  AlipayLoginDto,
  EmailLoginDto,
  EmailRegisterDto,
  QRCodeGenerateDto,
  QRCodeStatusDto 
} from './dto/auth.dto';
import { QRCodeType } from '@prisma/client';
import * as crypto from 'crypto';

// 内存存储模式 - 用于无数据库环境
interface MockUser {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  wechatOpenId?: string;
  alipayOpenId?: string;
  passwordHash?: string;
  avatarUrl?: string;
  lastLoginAt?: Date;
}

interface MockQRCode {
  scene: string;
  type: QRCodeType;
  expiresAt: Date;
  userId?: string;
  state?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private useMockDb = false;
  private mockUsers: Map<string, MockUser> = new Map();
  private mockQRCodes: Map<string, MockQRCode> = new Map();
  private mockTokenCounter = 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {
    this.initMockData();
  }

  private initMockData() {
    // 初始化模拟用户数据
    const defaultUsers: MockUser[] = [
      {
        id: 'user_sms_001',
        phone: '13800138000',
        name: '短信用户',
      },
      {
        id: 'user_email_001',
        email: 'admin@example.local',
        name: '管理员',
        passwordHash: this.hashPassword('admin123'),
      },
      {
        id: 'user_wx_001',
        wechatOpenId: 'wx_test001',
        name: '微信用户',
      },
      {
        id: 'user_ali_001',
        alipayOpenId: 'ali_test001',
        name: '支付宝用户',
      },
    ];
    defaultUsers.forEach(u => this.mockUsers.set(u.id, u));
  }

  private generateMockToken(userId: string): string {
    return `mock_token_${userId}_${++this.mockTokenCounter}`;
  }

  private getMockUserById(id: string): MockUser | undefined {
    return this.mockUsers.get(id);
  }

  private getMockUserByPhone(phone: string): MockUser | undefined {
    return Array.from(this.mockUsers.values()).find(u => u.phone === phone);
  }

  private getMockUserByEmail(email: string): MockUser | undefined {
    return Array.from(this.mockUsers.values()).find(u => u.email === email);
  }

  private getMockUserByWechat(openId: string): MockUser | undefined {
    return Array.from(this.mockUsers.values()).find(u => u.wechatOpenId === openId);
  }

  private getMockUserByAlipay(openId: string): MockUser | undefined {
    return Array.from(this.mockUsers.values()).find(u => u.alipayOpenId === openId);
  }

  private async initDatabase(): Promise<boolean> {
    if (this.useMockDb) return false;
    try {
      await this.prisma.$connect();
      return true;
    } catch {
      this.useMockDb = true;
      this.logger.warn('数据库连接失败，切换到内存存储模式');
      return false;
    }
  }

  /** 发送短信验证码 */
  async sendSmsCode(phone: string) {
    // TODO: 集成真实短信服务
    // 开发模式下生成固定验证码
    const code = '888888';
    this.logger.log(`SMS code for ${phone}: ${code} (dev mode)`);
    return { success: true, message: '验证码已发送' };
  }

  /** 短信验证码登录 */
  async loginBySms(dto: SmsLoginDto) {
    await this.initDatabase();
    
    // 开发模式接受任意6位验证码或888888
    const isValidCode = dto.code === '888888' || (dto.code.length === 6 && /^\d+$/.test(dto.code));
    if (!isValidCode) {
      throw new UnauthorizedException('验证码错误');
    }

    if (this.useMockDb) {
      // 内存存储模式
      let user = this.getMockUserByPhone(dto.phone);
      if (!user) {
        user = {
          id: `user_sms_${Date.now()}`,
          phone: dto.phone,
          name: `用户${dto.phone.slice(-4)}`,
        };
        this.mockUsers.set(user.id, user);
      }
      return {
        accessToken: this.generateMockToken(user.id),
        refreshToken: `refresh_${user.id}`,
        expiresIn: 86400,
        user: { id: user.id, name: user.name, phone: user.phone },
      };
    }

    let user = await this.prisma.user.findFirst({ where: { phone: dto.phone } });

    if (!user) {
      user = await this.createUserWithTeam({
        phone: dto.phone,
        name: `用户${dto.phone.slice(-4)}`,
        loginMethod: 'SMS',
      });
    }

    await this.updateLastLogin(user.id);
    return this.generateTokens(user.id, user.phone ?? user.email ?? '');
  }

  /** 邮箱密码登录 */
  async loginByEmail(dto: EmailLoginDto) {
    await this.initDatabase();
    
    if (this.useMockDb) {
      const user = this.getMockUserByEmail(dto.email);
      if (!user || !user.passwordHash) {
        throw new UnauthorizedException('邮箱或密码错误');
      }
      const isValid = this.comparePassword(dto.password, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedException('邮箱或密码错误');
      }
      return {
        accessToken: this.generateMockToken(user.id),
        refreshToken: `refresh_${user.id}`,
        expiresIn: 86400,
        user: { id: user.id, name: user.name, email: user.email },
      };
    }

    const user = await this.prisma.user.findFirst({ where: { email: dto.email } });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    // 验证密码 (bcrypt)
    const isValid = this.comparePassword(dto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('邮箱或密码错误');
    }

    await this.updateLastLogin(user.id);
    return this.generateTokens(user.id, user.email ?? '');
  }

  /** 邮箱注册 */
  async registerByEmail(dto: EmailRegisterDto) {
    await this.initDatabase();
    
    if (this.useMockDb) {
      const existing = this.getMockUserByEmail(dto.email);
      if (existing) {
        throw new UnauthorizedException('该邮箱已注册');
      }
      const passwordHash = this.hashPassword(dto.password);
      const user: MockUser = {
        id: `user_email_${Date.now()}`,
        email: dto.email,
        name: dto.name || `用户${dto.email.split('@')[0]}`,
        passwordHash,
      };
      this.mockUsers.set(user.id, user);
      return {
        accessToken: this.generateMockToken(user.id),
        refreshToken: `refresh_${user.id}`,
        expiresIn: 86400,
        user: { id: user.id, name: user.name, email: user.email },
      };
    }

    // 检查邮箱是否已存在
    const existing = await this.prisma.user.findFirst({ where: { email: dto.email } });
    if (existing) {
      throw new UnauthorizedException('该邮箱已注册');
    }

    // 创建用户
    const passwordHash = this.hashPassword(dto.password);
    const user = await this.createUserWithTeam({
      email: dto.email,
      name: dto.name || `用户${dto.email.split('@')[0]}`,
      passwordHash,
      loginMethod: 'EMAIL',
    });

    return this.generateTokens(user.id, user.email ?? '');
  }

  /** 微信扫码登录 */
  async loginByWechat(dto: WechatLoginDto) {
    await this.initDatabase();
    
    // 开发模式使用模拟openId
    const mockOpenId = `wx_${dto.code}`;

    if (this.useMockDb) {
      let user = this.getMockUserByWechat(mockOpenId);
      if (!user) {
        user = {
          id: `user_wx_${Date.now()}`,
          wechatOpenId: mockOpenId,
          name: `微信用户${mockOpenId.slice(-4)}`,
        };
        this.mockUsers.set(user.id, user);
      }
      return {
        accessToken: this.generateMockToken(user.id),
        refreshToken: `refresh_${user.id}`,
        expiresIn: 86400,
        user: { id: user.id, name: user.name },
      };
    }

    let user = await this.prisma.user.findFirst({ where: { wechatOpenId: mockOpenId } });

    if (!user) {
      user = await this.createUserWithTeam({
        wechatOpenId: mockOpenId,
        name: `微信用户${mockOpenId.slice(-4)}`,
        loginMethod: 'WECHAT',
      });
    }

    await this.updateLastLogin(user.id);
    return this.generateTokens(user.id, user.wechatOpenId ?? '');
  }

  /** 支付宝扫码登录 */
  async loginByAlipay(dto: AlipayLoginDto) {
    await this.initDatabase();
    
    // 开发模式使用模拟openId
    const mockOpenId = `ali_${dto.code}`;

    if (this.useMockDb) {
      let user = this.getMockUserByAlipay(mockOpenId);
      if (!user) {
        user = {
          id: `user_ali_${Date.now()}`,
          alipayOpenId: mockOpenId,
          name: `支付宝用户${mockOpenId.slice(-4)}`,
        };
        this.mockUsers.set(user.id, user);
      }
      return {
        accessToken: this.generateMockToken(user.id),
        refreshToken: `refresh_${user.id}`,
        expiresIn: 86400,
        user: { id: user.id, name: user.name },
      };
    }

    let user = await this.prisma.user.findFirst({ where: { alipayOpenId: mockOpenId } });

    if (!user) {
      user = await this.createUserWithTeam({
        alipayOpenId: mockOpenId,
        name: `支付宝用户${mockOpenId.slice(-4)}`,
        loginMethod: 'ALIPAY',
      });
    }

    await this.updateLastLogin(user.id);
    return this.generateTokens(user.id, user.alipayOpenId ?? '');
  }

  /** 生成登录二维码 */
  async generateQRCode(type: QRCodeType) {
    const scene = `dev_${type.toLowerCase()}_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期

    if (this.useMockDb) {
      const qrCode: MockQRCode = {
        scene,
        type,
        expiresAt,
        state: 'PENDING',
      };
      this.mockQRCodes.set(scene, qrCode);
      
      const qrContent = type === 'WECHAT' 
        ? `https://open.weixin.qq.com/connect/qrcode/${scene}`
        : `https://openapi.alipay.com/qrcode/${scene}`;

      return {
        scene,
        type,
        expiresIn: 300,
        qrContent,
        _devScene: scene,
      };
    }

    const qrCode = await this.prisma.loginQRCode.create({
      data: {
        scene,
        type,
        expiresAt,
      },
    });

    // 生成二维码内容URL (实际项目中这里会调用微信/支付宝SDK生成真实二维码)
    const qrContent = type === 'WECHAT' 
      ? `https://open.weixin.qq.com/connect/qrcode/${scene}`
      : `https://openapi.alipay.com/qrcode/${scene}`;

    return {
      scene,
      type,
      expiresIn: 300,
      qrContent,
      // 开发模式：直接返回scene用于模拟扫码
      _devScene: scene,
    };
  }

  /** 查询二维码状态 */
  async getQRCodeStatus(scene: string) {
    // 内存存储模式
    if (this.useMockDb) {
      const qrCode = this.mockQRCodes.get(scene);
      if (!qrCode) {
        return { state: 'NOT_FOUND', message: '二维码不存在' };
      }

      if (new Date() > qrCode.expiresAt) {
        return { state: 'EXPIRED', message: '二维码已过期' };
      }

      // 开发模式：使用特殊scene模拟扫码
      if (scene.includes('_wx_') || scene.includes('_wechat_')) {
        // 创建微信用户
        const userId = `user_wx_${Date.now()}`;
        const user: MockUser = {
          id: userId,
          wechatOpenId: `wx_dev_${scene.slice(-8)}`,
          name: '微信用户',
        };
        this.mockUsers.set(userId, user);
        return {
          state: 'CONFIRMED',
          user: { id: user.id, name: user.name },
          tokens: {
            accessToken: this.generateMockToken(user.id),
            refreshToken: `refresh_${user.id}`,
            expiresIn: 86400,
          },
        };
      }

      if (scene.includes('_ali_') || scene.includes('_alipay_')) {
        // 创建支付宝用户
        const userId = `user_ali_${Date.now()}`;
        const user: MockUser = {
          id: userId,
          alipayOpenId: `ali_dev_${scene.slice(-8)}`,
          name: '支付宝用户',
        };
        this.mockUsers.set(userId, user);
        return {
          state: 'CONFIRMED',
          user: { id: user.id, name: user.name },
          tokens: {
            accessToken: this.generateMockToken(user.id),
            refreshToken: `refresh_${user.id}`,
            expiresIn: 86400,
          },
        };
      }

      return { 
        state: qrCode.state || 'PENDING', 
        message: '等待扫码' 
      };
    }

    // 数据库模式
    const qrCode = await this.prisma.loginQRCode.findFirst({
      where: { scene },
    });

    if (!qrCode) {
      return { state: 'NOT_FOUND', message: '二维码不存在' };
    }

    if (new Date() > qrCode.expiresAt) {
      await this.prisma.loginQRCode.update({
        where: { id: qrCode.id },
        data: { state: 'EXPIRED' },
      });
      return { state: 'EXPIRED', message: '二维码已过期' };
    }

    // 开发模式：使用特殊code模拟扫码
    if (qrCode.type === 'WECHAT' && scene.startsWith('dev_wx_')) {
      const userId = qrCode.userId;
      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          return {
            state: 'CONFIRMED',
            user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
            tokens: this.generateTokens(user.id, user.wechatOpenId ?? ''),
          };
        }
      }
    }

    if (qrCode.type === 'ALIPAY' && scene.startsWith('dev_ali_')) {
      const userId = qrCode.userId;
      if (userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          return {
            state: 'CONFIRMED',
            user: { id: user.id, name: user.name, avatarUrl: user.avatarUrl },
            tokens: this.generateTokens(user.id, user.alipayOpenId ?? ''),
          };
        }
      }
    }

    return { 
      state: qrCode.state, 
      message: qrCode.state === 'PENDING' ? '等待扫码' : 
               qrCode.state === 'SCANNED' ? '已扫码，请确认' : '' 
    };
  }

  /** 获取当前用户信息 */
  async getProfile(userId: string) {
    if (this.useMockDb) {
      const user = this.getMockUserById(userId);
      if (!user) {
        throw new UnauthorizedException('用户不存在');
      }
      return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        loginMethod: user.phone ? 'SMS' : user.email ? 'EMAIL' : 'WECHAT',
        createdAt: new Date(),
        teams: [{ team: { id: 'team_default', name: '默认团队' } }],
        subscription: {
          plan: 'FREE',
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          aiQuotaDaily: 100,
          aiQuotaUsed: 0,
        },
      };
    }

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

  // ============ 私有辅助方法 ============

  private async createUserWithTeam(userData: {
    phone?: string;
    email?: string;
    wechatOpenId?: string;
    alipayOpenId?: string;
    name: string;
    passwordHash?: string;
    loginMethod: string;
  }) {
    const user = await this.prisma.user.create({
      data: {
        phone: userData.phone,
        email: userData.email,
        wechatOpenId: userData.wechatOpenId,
        alipayOpenId: userData.alipayOpenId,
        name: userData.name,
        passwordHash: userData.passwordHash || '',
        loginMethod: userData.loginMethod as any,
      },
    });

    // 创建默认团队
    const team = await this.prisma.team.create({
      data: { name: `${user.name}的团队` },
    });
    await this.prisma.teamMember.create({
      data: { teamId: team.id, userId: user.id, role: 'OWNER' },
    });

    // 创建免费订阅
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

    return user;
  }

  private async updateLastLogin(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lastLoginAt: new Date() },
    });
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

  private hashPassword(password: string): string {
    // 简单hash用于开发，生产应使用bcrypt
    const salt = 'dev_salt';
    return crypto.createHash('sha256').update(password + salt).digest('hex');
  }

  private comparePassword(password: string, hash: string): boolean {
    const salt = 'dev_salt';
    const passwordHash = crypto.createHash('sha256').update(password + salt).digest('hex');
    return passwordHash === hash;
  }
}
