import { Controller, Post, Get, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { 
  SmsLoginDto, 
  WechatLoginDto, 
  AlipayLoginDto,
  EmailLoginDto,
  EmailRegisterDto,
  QRCodeGenerateDto,
  QRCodeStatusDto 
} from './dto/auth.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sms/send')
  @ApiOperation({ summary: '发送短信验证码' })
  async sendSmsCode(@Body('phone') phone: string) {
    return this.authService.sendSmsCode(phone);
  }

  @Post('sms/login')
  @ApiOperation({ summary: '短信验证码登录' })
  async loginBySms(@Body() dto: SmsLoginDto) {
    return this.authService.loginBySms(dto);
  }

  @Post('email/login')
  @ApiOperation({ summary: '邮箱密码登录' })
  async loginByEmail(@Body() dto: EmailLoginDto) {
    return this.authService.loginByEmail(dto);
  }

  @Post('email/register')
  @ApiOperation({ summary: '邮箱注册' })
  async registerByEmail(@Body() dto: EmailRegisterDto) {
    return this.authService.registerByEmail(dto);
  }

  @Post('wechat/login')
  @ApiOperation({ summary: '微信扫码登录' })
  async loginByWechat(@Body() dto: WechatLoginDto) {
    return this.authService.loginByWechat(dto);
  }

  @Post('alipay/login')
  @ApiOperation({ summary: '支付宝扫码登录' })
  async loginByAlipay(@Body() dto: AlipayLoginDto) {
    return this.authService.loginByAlipay(dto);
  }

  @Post('qrcode/generate')
  @ApiOperation({ summary: '生成登录二维码' })
  async generateQRCode(@Body() dto: QRCodeGenerateDto) {
    return this.authService.generateQRCode(dto.type);
  }

  @Get('qrcode/status')
  @ApiOperation({ summary: '查询二维码状态' })
  async getQRCodeStatus(@Query('scene') scene: string) {
    return this.authService.getQRCodeStatus(scene);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Req() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
