import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service.js';
import { ConnectBrowserDto, NavigateDto, ExecuteScriptDto, ScreenshotDto } from './dto/cdp.dto';
import { CdpSessionStatus } from '@prisma/client';

/** Platform login detection selectors */
const PLATFORM_SELECTORS: Record<string, { loginIndicator: string; loggedInIndicator: string; loginUrl: string }> = {
  XIAOHONGSHU: {
    loginIndicator: '.login-btn, .login-container',
    loggedInIndicator: '.user-info, .side-nav-user, [class*="avatar"]',
    loginUrl: 'https://www.xiaohongshu.com',
  },
  DOUYIN: {
    loginIndicator: '.login-panel, [class*="login"]',
    loggedInIndicator: '.avatar-icon, [class*="user-info"]',
    loginUrl: 'https://creator.douyin.com',
  },
  TIKTOK: {
    loginIndicator: '[data-e2e="login-button"]',
    loggedInIndicator: '[data-e2e="profile-icon"], [class*="avatar"]',
    loginUrl: 'https://www.tiktok.com',
  },
  INSTAGRAM: {
    loginIndicator: 'input[name="username"]',
    loggedInIndicator: '[data-testid="user-avatar"], img[alt*="profile"]',
    loginUrl: 'https://www.instagram.com',
  },
};

@Injectable()
export class CdpService {
  private readonly logger = new Logger(CdpService.name);
  private activeConnections = new Map<string, { ws: any; tabs: Map<number, any> }>();

  constructor(private readonly prisma: PrismaService) {}

  /** Get CDP session status for a team */
  async getSessionStatus(teamId: string) {
    const session = await this.prisma.cdpSession.findUnique({ where: { teamId } });
    if (!session) {
      return { status: CdpSessionStatus.DISCONNECTED, debugPort: 9222 };
    }
    return {
      status: session.status,
      debugPort: session.debugPort,
      chromeVersion: session.chromeVersion,
      connectedAt: session.connectedAt,
    };
  }

  /** Connect to a Chrome browser via CDP */
  async connectBrowser(teamId: string, dto: ConnectBrowserDto) {
    const host = dto.host || 'localhost';
    const port = dto.port || 9222;

    try {
      // Check if Chrome debug port is reachable
      const response = await fetch(`http://${host}:${port}/json/version`);
      if (!response.ok) {
        throw new Error(`Chrome debug port not reachable at ${host}:${port}`);
      }

      const versionInfo = await response.json() as { Browser?: string; 'User-Agent'?: string };
      const chromeVersion = versionInfo.Browser || 'Unknown';

      // Update or create CDP session
      await this.prisma.cdpSession.upsert({
        where: { teamId },
        update: {
          status: CdpSessionStatus.CONNECTED,
          debugPort: port,
          chromeVersion,
          connectedAt: new Date(),
          lastHeartbeat: new Date(),
        },
        create: {
          teamId,
          status: CdpSessionStatus.CONNECTED,
          debugPort: port,
          chromeVersion,
          connectedAt: new Date(),
        },
      });

      // List available tabs
      const tabsResponse = await fetch(`http://${host}:${port}/json`);
      const tabs = await tabsResponse.json() as Array<{ id: string; title: string; url: string; type: string }>;

      this.logger.log(`CDP connected: ${host}:${port}, Chrome ${chromeVersion}, ${tabs.length} tabs`);

      return {
        connected: true,
        chromeVersion,
        tabs: tabs.filter(t => t.type === 'page').map(t => ({
          id: t.id,
          title: t.title,
          url: t.url,
        })),
      };
    } catch (error) {
      await this.prisma.cdpSession.upsert({
        where: { teamId },
        update: { status: CdpSessionStatus.DISCONNECTED },
        create: { teamId, status: CdpSessionStatus.DISCONNECTED, debugPort: port },
      });

      throw new BadRequestException(
        `无法连接 Chrome 调试端口 ${host}:${port}。请确认 Chrome 已以调试模式启动。`,
      );
    }
  }

  /** Disconnect from Chrome */
  async disconnectBrowser(teamId: string) {
    await this.prisma.cdpSession.update({
      where: { teamId },
      data: {
        status: CdpSessionStatus.DISCONNECTED,
        lastHeartbeat: new Date(),
      },
    });

    this.activeConnections.delete(teamId);
    return { disconnected: true };
  }

  /** Check which platforms are logged in via CDP */
  async scanPlatformLogins(teamId: string) {
    const session = await this.prisma.cdpSession.findUnique({ where: { teamId } });
    if (!session || session.status !== CdpSessionStatus.CONNECTED) {
      throw new BadRequestException('浏览器未连接，请先连接 Chrome');
    }

    const results: Record<string, { loggedIn: boolean; detected: boolean }> = {};

    for (const [platform, selectors] of Object.entries(PLATFORM_SELECTORS)) {
      try {
        // Navigate to platform and check login status
        // In production, this would use CDP to navigate and evaluate JS
        // For now, return mock detection results
        results[platform] = {
          loggedIn: platform === 'INSTAGRAM', // Mock: only Instagram is logged in
          detected: true,
        };
      } catch {
        results[platform] = { loggedIn: false, detected: false };
      }
    }

    return results;
  }

  /** Navigate browser to a URL */
  async navigate(teamId: string, dto: NavigateDto) {
    const session = await this.prisma.cdpSession.findUnique({ where: { teamId } });
    if (!session || session.status !== CdpSessionStatus.CONNECTED) {
      throw new BadRequestException('浏览器未连接');
    }

    // TODO: Use CDP WebSocket to navigate
    this.logger.log(`Navigate to: ${dto.url}`);
    return { navigated: true, url: dto.url };
  }

  /** Execute JavaScript in browser */
  async executeScript(teamId: string, dto: ExecuteScriptDto) {
    const session = await this.prisma.cdpSession.findUnique({ where: { teamId } });
    if (!session || session.status !== CdpSessionStatus.CONNECTED) {
      throw new BadRequestException('浏览器未连接');
    }

    // TODO: Use CDP Runtime.evaluate to execute script
    this.logger.log(`Execute script: ${dto.script.substring(0, 100)}...`);
    return { executed: true };
  }

  /** Take screenshot */
  async screenshot(teamId: string, dto: ScreenshotDto) {
    const session = await this.prisma.cdpSession.findUnique({ where: { teamId } });
    if (!session || session.status !== CdpSessionStatus.CONNECTED) {
      throw new BadRequestException('浏览器未连接');
    }

    // TODO: Use CDP Page.captureScreenshot
    return { captured: true, format: dto.format || 'png' };
  }

  /** Generate Chrome launch command for help wizard */
  getLaunchCommands() {
    return {
      macos: '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222',
      windows: 'start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222',
      linux: 'google-chrome --remote-debugging-port=9222',
    };
  }

  /** Check if Chrome debug port is accessible */
  async checkDebugPort(host: string = 'localhost', port: number = 9222) {
    try {
      const response = await fetch(`http://${host}:${port}/json/version`, {
        signal: AbortSignal.timeout(3000),
      });
      if (response.ok) {
        const info = await response.json() as { Browser?: string };
        return { reachable: true, chromeVersion: info.Browser || 'Unknown' };
      }
      return { reachable: false };
    } catch {
      return { reachable: false };
    }
  }
}
