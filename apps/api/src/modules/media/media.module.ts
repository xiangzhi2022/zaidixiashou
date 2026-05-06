import { Module, Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

// ========== DTOs ==========

class CreateAssetDto {
  name: string;
  type: 'image' | 'video' | 'text';
  category: string;
  url?: string;
  tags?: string[];
}

class UpdateAssetDto {
  name?: string;
  category?: string;
  tags?: string[];
}

class CreateScheduleDto {
  title: string;
  platform: string;
  content: string;
  scheduledAt: string;
  status?: 'draft' | 'pending_review' | 'scheduled' | 'published';
  tags?: string[];
}

class UpdateScheduleDto {
  title?: string;
  platform?: string;
  content?: string;
  scheduledAt?: string;
  status?: 'draft' | 'pending_review' | 'scheduled' | 'published';
  tags?: string[];
}

class ConnectPlatformDto {
  platform: string;
  action: 'connect' | 'disconnect';
}

// ========== Mock Data Store ==========

const mockAssets: Array<{
  id: string; name: string; type: 'image' | 'video' | 'text'; category: string;
  url: string; tags: string[]; createdAt: string; size: string; reusable: boolean;
}> = [
  { id: 'asset-1', name: '旅行收纳产品图-1', type: 'image' as const, category: '产品图', url: '', tags: ['旅行', '收纳'], createdAt: '2025-05-01', size: '2.4MB', reusable: true },
  { id: 'asset-2', name: '行李箱对比视频', type: 'video' as const, category: '短视频', url: '', tags: ['开箱', '对比'], createdAt: '2025-05-02', size: '18.7MB', reusable: true },
  { id: 'asset-3', name: '小红书文案模板', type: 'text' as const, category: '文案', url: '', tags: ['小红书', '种草'], createdAt: '2025-05-03', size: '12KB', reusable: true },
  { id: 'asset-4', name: '收纳盒特写', type: 'image' as const, category: '产品图', url: '', tags: ['收纳', '特写'], createdAt: '2025-05-04', size: '3.1MB', reusable: false },
  { id: 'asset-5', name: '达人测评视频', type: 'video' as const, category: '短视频', url: '', tags: ['测评', '达人'], createdAt: '2025-05-05', size: '25.3MB', reusable: true },
  { id: 'asset-6', name: 'Instagram 英文文案', type: 'text' as const, category: '文案', url: '', tags: ['Instagram', '英文'], createdAt: '2025-05-05', size: '8KB', reusable: true },
  { id: 'asset-7', name: '旅行场景图-海边', type: 'image' as const, category: '场景图', url: '', tags: ['旅行', '海边'], createdAt: '2025-05-06', size: '4.2MB', reusable: true },
  { id: 'asset-8', name: '打包流程GIF', type: 'image' as const, category: '动图', url: '', tags: ['打包', '教程'], createdAt: '2025-05-06', size: '5.8MB', reusable: true },
];

const mockSchedules: Array<{
  id: string; title: string; platform: string; content: string;
  scheduledAt: string; status: 'draft' | 'pending_review' | 'scheduled' | 'published'; tags: string[];
}> = [
  { id: 'sch-001', title: '旅行收纳清单', platform: '小红书', content: '出行必备收纳技巧，10 个神器让行李箱整整齐齐…', scheduledAt: '2025-05-07T14:00:00', status: 'scheduled' as const, tags: ['旅行', '收纳'] },
  { id: 'sch-002', title: '行李箱整理对比', platform: '抖音', content: 'Before vs After 行李箱整理挑战', scheduledAt: '2025-05-07T18:00:00', status: 'pending_review' as const, tags: ['对比', '开箱'] },
  { id: 'sch-003', title: '达人测评合作', platform: 'Instagram', content: 'Weekend bag reset - What I pack for a quick getaway', scheduledAt: '2025-05-08T10:00:00', status: 'draft' as const, tags: ['测评', '合作'] },
  { id: 'sch-004', title: 'TikTok收纳好物', platform: 'TikTok', content: 'Travel packing hacks you need! #packinghacks', scheduledAt: '2025-05-09T12:00:00', status: 'scheduled' as const, tags: ['好物', '分享'] },
  { id: 'sch-005', title: '收纳盒组合推荐', platform: '小红书', content: '这套收纳组合绝了，每个空间都利用到了极致', scheduledAt: '2025-05-10T15:00:00', status: 'draft' as const, tags: ['收纳', '推荐'] },
  { id: 'sch-006', title: '打包清单视频', platform: '抖音', content: '30秒学会超高效打包法', scheduledAt: '2025-05-11T19:00:00', status: 'pending_review' as const, tags: ['教程', '打包'] },
];

const mockPlatforms = [
  { id: 'plat-1', name: '小红书', domain: 'xiaohongshu.com', icon: 'book-open', status: 'need_login' as const, followers: 12500, postsThisWeek: 3 },
  { id: 'plat-2', name: '抖音', domain: 'douyin.com', icon: 'music', status: 'pending_auth' as const, followers: 8900, postsThisWeek: 2 },
  { id: 'plat-3', name: 'TikTok', domain: 'tiktok.com', icon: 'music-2', status: 'available' as const, followers: 0, postsThisWeek: 0 },
  { id: 'plat-4', name: 'Instagram', domain: 'instagram.com', icon: 'camera', status: 'connected' as const, followers: 5600, postsThisWeek: 3 },
];

const mockStats = {
  todayPending: 12,
  todayNeedApproval: 4,
  totalAssets: 126,
  reusableAssets: 38,
  interactionMessages: 43,
  avgResponseMinutes: 18,
  influencerCoop: 9,
  influencerPending: 3,
  weeklyPublished: 8,
  pendingReview: 3,
  approvalRate: 92,
};

// ========== Controller ==========

@ApiTags('Media')
@Controller('media')
export class MediaController {

  @Get('stats')
  @ApiOperation({ summary: '获取运营中心统计数据' })
  getStats() {
    return { success: true, data: mockStats };
  }

  @Get('platforms')
  @ApiOperation({ summary: '获取平台账号矩阵' })
  getPlatforms() {
    return { success: true, data: mockPlatforms };
  }

  @Post('platforms/connect')
  @ApiOperation({ summary: '连接/断开平台账号' })
  connectPlatform(@Body() dto: ConnectPlatformDto) {
    const plat = mockPlatforms.find(p => p.name === dto.platform || p.id === dto.platform);
    if (!plat) return { success: false, error: '平台不存在' };
    if (dto.action === 'connect') {
      plat.status = 'connected';
      return { success: true, data: plat, message: `${plat.name} 已连接` };
    } else {
      plat.status = 'available';
      return { success: true, data: plat, message: `${plat.name} 已断开` };
    }
  }

  @Get('assets')
  @ApiOperation({ summary: '获取素材列表' })
  getAssets(
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    let filtered = [...mockAssets];
    if (type && type !== 'all') filtered = filtered.filter(a => a.type === type);
    if (category && category !== 'all') filtered = filtered.filter(a => a.category === category);
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(a => a.name.toLowerCase().includes(q) || a.tags.some(t => t.toLowerCase().includes(q)));
    }
    const p = parseInt(page || '1', 10);
    const ps = parseInt(pageSize || '20', 10);
    const total = filtered.length;
    const data = filtered.slice((p - 1) * ps, p * ps);
    const categories = [...new Set(mockAssets.map(a => a.category))];
    return { success: true, data, total, page: p, pageSize: ps, categories };
  }

  @Post('assets')
  @ApiOperation({ summary: '创建素材' })
  createAsset(@Body() dto: CreateAssetDto) {
    const asset: typeof mockAssets[number] = {
      id: `asset-${Date.now()}`,
      name: dto.name,
      type: dto.type,
      category: dto.category,
      url: dto.url || '',
      tags: dto.tags || [],
      createdAt: new Date().toISOString().split('T')[0],
      size: '0KB',
      reusable: false,
    };
    mockAssets.unshift(asset);
    return { success: true, data: asset };
  }

  @Put('assets/:id')
  @ApiOperation({ summary: '更新素材' })
  updateAsset(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    const idx = mockAssets.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: '素材不存在' };
    Object.assign(mockAssets[idx], dto);
    return { success: true, data: mockAssets[idx] };
  }

  @Delete('assets/:id')
  @ApiOperation({ summary: '删除素材' })
  deleteAsset(@Param('id') id: string) {
    const idx = mockAssets.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: '素材不存在' };
    mockAssets.splice(idx, 1);
    return { success: true };
  }

  @Get('schedules')
  @ApiOperation({ summary: '获取排期列表' })
  getSchedules(
    @Query('status') status?: string,
    @Query('platform') platform?: string,
    @Query('month') month?: string,
  ) {
    let filtered = [...mockSchedules];
    if (status && status !== 'all') filtered = filtered.filter(s => s.status === status);
    if (platform && platform !== 'all') filtered = filtered.filter(s => s.platform === platform);
    if (month) {
      filtered = filtered.filter(s => s.scheduledAt.startsWith(month));
    }
    return { success: true, data: filtered };
  }

  @Post('schedules')
  @ApiOperation({ summary: '创建排期' })
  createSchedule(@Body() dto: CreateScheduleDto) {
    const schedule: Omit<typeof mockSchedules[number], 'id'> & { id: string } = {
      id: `sch-${Date.now()}`,
      title: dto.title,
      platform: dto.platform,
      content: dto.content,
      scheduledAt: dto.scheduledAt,
      status: dto.status ?? 'draft',
      tags: dto.tags ?? [],
    };
    mockSchedules.unshift(schedule);
    return { success: true, data: schedule };
  }

  @Put('schedules/:id')
  @ApiOperation({ summary: '更新排期' })
  updateSchedule(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    const idx = mockSchedules.findIndex(s => s.id === id);
    if (idx === -1) return { success: false, error: '排期不存在' };
    Object.assign(mockSchedules[idx], dto);
    return { success: true, data: mockSchedules[idx] };
  }

  @Delete('schedules/:id')
  @ApiOperation({ summary: '删除排期' })
  deleteSchedule(@Param('id') id: string) {
    const idx = mockSchedules.findIndex(s => s.id === id);
    if (idx === -1) return { success: false, error: '排期不存在' };
    mockSchedules.splice(idx, 1);
    return { success: true };
  }

  @Get('calendar')
  @ApiOperation({ summary: '获取日历数据' })
  getCalendar(@Query('year') year?: string, @Query('month') month?: string) {
    const y = parseInt(year || new Date().getFullYear().toString(), 10);
    const m = parseInt(month || (new Date().getMonth() + 1).toString(), 10);
    const monthStr = `${y}-${String(m).padStart(2, '0')}`;
    const items = mockSchedules.filter(s => s.scheduledAt.startsWith(monthStr));
    const daysInMonth = new Date(y, m, 0).getDate();
    const firstDayOfWeek = new Date(y, m - 1, 1).getDay();
    const calendar: Array<{ day: number; items: typeof items }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${monthStr}-${String(d).padStart(2, '0')}`;
      calendar.push({ day: d, items: items.filter(s => s.scheduledAt.startsWith(dayStr)) });
    }
    return { success: true, data: { year: y, month: m, firstDayOfWeek, calendar } };
  }
}

@Module({
  controllers: [MediaController],
})
export class MediaModule {}
