import { Controller, Get, Post, Delete, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CdpService } from './cdp.service.js';
import { ConnectBrowserDto, NavigateDto, ExecuteScriptDto, ScreenshotDto } from './dto/cdp.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('CDP 浏览器控制')
@Controller('cdp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CdpController {
  constructor(private readonly cdpService: CdpService) {}

  @Get('status')
  @ApiOperation({ summary: '获取 CDP 连接状态' })
  async getStatus(@Req() req: { user: { id: string; teamId?: string } }) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.getSessionStatus(teamId);
  }

  @Post('connect')
  @ApiOperation({ summary: '连接 Chrome 浏览器' })
  async connect(@Req() req: { user: { id: string; teamId?: string } }, @Body() dto: ConnectBrowserDto) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.connectBrowser(teamId, dto);
  }

  @Delete('connect')
  @ApiOperation({ summary: '断开浏览器连接' })
  async disconnect(@Req() req: { user: { id: string; teamId?: string } }) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.disconnectBrowser(teamId);
  }

  @Post('navigate')
  @ApiOperation({ summary: '浏览器导航' })
  async navigate(@Req() req: { user: { id: string; teamId?: string } }, @Body() dto: NavigateDto) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.navigate(teamId, dto);
  }

  @Post('execute')
  @ApiOperation({ summary: '执行 JavaScript 脚本' })
  async executeScript(@Req() req: { user: { id: string; teamId?: string } }, @Body() dto: ExecuteScriptDto) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.executeScript(teamId, dto);
  }

  @Post('screenshot')
  @ApiOperation({ summary: '截取浏览器屏幕' })
  async screenshot(@Req() req: { user: { id: string; teamId?: string } }, @Body() dto: ScreenshotDto) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.screenshot(teamId, dto);
  }

  @Get('scan-logins')
  @ApiOperation({ summary: '扫描已登录平台' })
  async scanLogins(@Req() req: { user: { id: string; teamId?: string } }) {
    const teamId = req.user.teamId || 'team_local';
    return this.cdpService.scanPlatformLogins(teamId);
  }

  @Get('launch-commands')
  @ApiOperation({ summary: '获取 Chrome 启动命令' })
  getLaunchCommands() {
    return this.cdpService.getLaunchCommands();
  }

  @Get('check-port')
  @ApiOperation({ summary: '检测 Chrome 调试端口' })
  async checkPort(@Query('host') host?: string, @Query('port') port?: number) {
    return this.cdpService.checkDebugPort(host, Number(port) || 9222);
  }
}
