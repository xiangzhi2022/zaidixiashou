import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { SmsLoginDto, WechatLoginDto } from './dto/auth.dto.js';
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

  @Post('wechat/login')
  @ApiOperation({ summary: '微信扫码登录' })
  async loginByWechat(@Body() dto: WechatLoginDto) {
    return this.authService.loginByWechat(dto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '获取当前用户信息' })
  async getProfile(@Req() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }
}
