import { Link } from 'react-router-dom';
import {
  Send,
  FolderOpen,
  MessageCircle,
  Handshake,
  RefreshCw,
  Plus,
  LayoutGrid,
  Command,
  Image,
  FileCheck,
  ChevronRight,
  Calendar,
  BookOpen,
  Music,
  Camera,
  Music2,
} from 'lucide-react';

const metrics = [
  { label: '今日待发布', value: '12', icon: Send, iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: '4条需审批' },
  { label: '内容素材', value: '126', icon: FolderOpen, iconBg: 'bg-success/10', iconColor: 'text-success', sub: '38条可复用' },
  { label: '互动消息', value: '43', icon: MessageCircle, iconBg: 'bg-warning/10', iconColor: 'text-warning', sub: '平均响应18分钟' },
  { label: '达人合作', value: '9', icon: Handshake, iconBg: 'bg-error/10', iconColor: 'text-error', sub: '3个待报价' },
];

const platforms = [
  { name: '小红书', domain: 'xiaohongshu.com', icon: BookOpen, iconBg: 'bg-error/10', iconColor: 'text-error', status: '需登录', statusBg: 'bg-warning/15', statusColor: 'text-warning', action: '连接' },
  { name: '抖音', domain: 'douyin.com', icon: Music, iconBg: 'bg-on-surface/5', iconColor: 'text-on-surface', status: '待授权', statusBg: 'bg-warning/15', statusColor: 'text-warning', action: '连接' },
  { name: 'TikTok', domain: 'tiktok.com', icon: Music2, iconBg: 'bg-on-surface/5', iconColor: 'text-on-surface-variant', status: '可接入', statusBg: 'bg-success/15', statusColor: 'text-success', action: '连接' },
  { name: 'Instagram', domain: 'instagram.com', icon: Camera, iconBg: 'bg-primary/10', iconColor: 'text-primary', status: '已连接', statusBg: 'bg-success/15', statusColor: 'text-success', action: '管理' },
];

const schedules = [
  { name: '旅行收纳清单', platform: '小红书', time: '预计今天 14:00 发布', dotColor: 'bg-success', status: '已排期', statusBg: 'bg-success/15', statusColor: 'text-success' },
  { name: '行李箱整理对比', platform: '抖音', time: '待审核后发布', dotColor: 'bg-warning', status: '待审核', statusBg: 'bg-warning/15', statusColor: 'text-warning' },
  { name: '达人测评合作', platform: 'Instagram', time: '编辑中', dotColor: 'bg-on-surface-variant/40', status: '草稿', statusBg: 'bg-surface-container-high', statusColor: 'text-on-surface-variant' },
];

export function MediaPage() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">运营中心</h1>
          <p className="text-sm text-on-surface-variant mt-1">媒体账号矩阵总览与内容生产线入口</p>
        </div>
        <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" />刷新
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-surface rounded-lg shadow-card p-5 cursor-pointer hover:shadow-float transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${m.iconBg} rounded-md flex items-center justify-center`}><Icon className={`w-4 h-4 ${m.iconColor}`} /></div>
                  <span className="text-sm font-medium text-on-surface-variant">{m.label}</span>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-on-surface">{m.value}</span>
                <span className="text-xs text-on-surface-variant mb-1">{m.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Left: Platform Matrix */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-on-surface-variant" />
              <h2 className="text-base font-semibold text-on-surface">媒体账号矩阵</h2>
            </div>
            <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />连接账号
            </button>
          </div>
          <div className="space-y-3">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.name} className="flex items-center justify-between p-3 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${p.iconBg} rounded-md flex items-center justify-center`}><Icon className={`w-4 h-4 ${p.iconColor}`} /></div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">{p.name}</span>
                      <p className="text-xs text-on-surface-variant">{p.domain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.statusBg} ${p.statusColor}`}>{p.status}</span>
                    <button className="text-primary text-sm font-medium hover:underline">{p.action}</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Operations Center */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Command className="w-4 h-4 text-on-surface-variant" />
            <h2 className="text-base font-semibold text-on-surface">运营中心</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Image className="w-5 h-5 text-primary" /></div>
                <div>
                  <span className="text-sm font-medium text-on-surface">图像视频生成</span>
                  <p className="text-xs text-on-surface-variant">AI 创作图文、配图建议和视频脚本</p>
                </div>
              </div>
              <Link to="/media-creative" className="bg-surface-container-high text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-highest active:scale-[0.98] transition-all inline-flex items-center gap-2">
                进入<ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center"><FileCheck className="w-5 h-5 text-warning" /></div>
                <div>
                  <span className="text-sm font-medium text-on-surface">草稿审核发布</span>
                  <p className="text-xs text-on-surface-variant">预览草稿、风险检查、多平台发布</p>
                </div>
              </div>
              <Link to="/media-drafts" className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                进入<ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-outline-variant/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-lg font-bold text-on-surface">8</p><p className="text-xs text-on-surface-variant">本周发布</p></div>
              <div><p className="text-lg font-bold text-on-surface">3</p><p className="text-xs text-on-surface-variant">待审核</p></div>
              <div><p className="text-lg font-bold text-on-surface">92%</p><p className="text-xs text-on-surface-variant">通过率</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-surface rounded-lg shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-on-surface-variant" />
            <h2 className="text-base font-semibold text-on-surface">媒体排期</h2>
          </div>
          <button className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1">
            查看全部<ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="divide-y divide-outline-variant/30">
          {schedules.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-3 hover:bg-surface-container/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${s.dotColor}`} />
                <div>
                  <span className="text-sm font-medium text-on-surface">{s.name}</span>
                  <p className="text-xs text-on-surface-variant">{s.platform} · {s.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${s.statusBg} ${s.statusColor}`}>{s.status}</span>
                <ChevronRight className="w-4 h-4 text-on-surface-variant/50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
