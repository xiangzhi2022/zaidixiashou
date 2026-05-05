import { useState } from 'react';
import {
  UserPlus,
  Send,
  TrendingUp,
  Loader,
  Plus,
  Download,
  CheckCircle,
} from 'lucide-react';

const metrics = [
  { label: '新增潜客', value: '326', icon: UserPlus, iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: '↑ 12.5% 较昨日', subColor: 'text-success' },
  { label: '已触达', value: '89', icon: Send, iconBg: 'bg-success/10', iconColor: 'text-success', sub: '↑ 8.2% 较昨日', subColor: 'text-success' },
  { label: '触达转化率', value: '12.3%', icon: TrendingUp, iconBg: 'bg-warning/10', iconColor: 'text-warning', sub: '目标 15%', subColor: 'text-on-surface-variant' },
  { label: '进行中任务', value: '3', icon: Loader, iconBg: 'bg-primary/10', iconColor: 'text-primary', sub: '2 个待启动', subColor: 'text-on-surface-variant' },
];

interface Task {
  name: string; platform: string; status: string; statusBg: string; statusColor: string; prospects: string; time: string; actions: { label: string; color: string }[];
}
const tasks: Task[] = [
  { name: '小红书旅行收纳话题抓取', platform: '小红书', status: '运行中', statusBg: 'bg-primary/15', statusColor: 'text-primary', prospects: '128人', time: '2025-01-15 14:30', actions: [{ label: '查看结果', color: 'text-primary' }, { label: '停止', color: 'text-error' }] },
  { name: 'Instagram收纳Reels评论抓取', platform: 'Instagram', status: '已完成', statusBg: 'bg-success/15', statusColor: 'text-success', prospects: '89人', time: '2025-01-14 09:15', actions: [{ label: '查看结果', color: 'text-primary' }, { label: '重新运行', color: 'text-primary' }] },
  { name: 'TikTok家居好物评论采集', platform: 'TikTok', status: '待启动', statusBg: 'bg-warning/15', statusColor: 'text-warning', prospects: '—', time: '2025-01-15 16:00', actions: [{ label: '启动', color: 'text-primary' }, { label: '删除', color: 'text-error' }] },
  { name: 'LinkedIn跨境电商从业者搜索', platform: 'LinkedIn', status: '运行中', statusBg: 'bg-primary/15', statusColor: 'text-primary', prospects: '56人', time: '2025-01-15 11:20', actions: [{ label: '查看结果', color: 'text-primary' }, { label: '停止', color: 'text-error' }] },
  { name: '抖音收纳达人粉丝抓取', platform: '抖音', status: '已失败', statusBg: 'bg-error/15', statusColor: 'text-error', prospects: '23人', time: '2025-01-13 20:45', actions: [{ label: '重试', color: 'text-primary' }, { label: '删除', color: 'text-error' }] },
];

interface Prospect {
  name: string; platform: string; interaction: string; score: number; scoreColor: string; scoreBarColor: string; status: string; statusBg: string; statusColor: string;
}
const prospects: Prospect[] = [
  { name: '@旅行小确幸', platform: '小红书', interaction: '评论互动', score: 92, scoreColor: 'text-success', scoreBarColor: 'bg-success', status: '已评分', statusBg: 'bg-success/15', statusColor: 'text-success' },
  { name: '@OrganizeQueen', platform: 'Instagram', interaction: '点赞收藏', score: 75, scoreColor: 'text-primary', scoreBarColor: 'bg-primary', status: '已评分', statusBg: 'bg-success/15', statusColor: 'text-success' },
  { name: '@收纳控小王', platform: '小红书', interaction: '关注转发', score: 58, scoreColor: 'text-warning', scoreBarColor: 'bg-warning', status: '新潜客', statusBg: 'bg-primary/15', statusColor: 'text-primary' },
  { name: '@traveler_jay', platform: 'TikTok', interaction: '评论互动', score: 35, scoreColor: 'text-error', scoreBarColor: 'bg-error', status: '已排除', statusBg: 'bg-surface-container-high', statusColor: 'text-on-surface-variant' },
];

interface Campaign {
  name: string; platform: string; status: string; statusBg: string; statusColor: string; sent: string; actions: { label: string; color: string }[];
}
const campaigns: Campaign[] = [
  { name: '旅行收纳新品体验邀请', platform: '小红书', status: '待审批', statusBg: 'bg-warning/15', statusColor: 'text-warning', sent: '0/45', actions: [{ label: '编辑模板', color: 'text-primary' }, { label: '提交审批', color: 'text-primary' }] },
  { name: 'Instagram收纳达人合作邀请', platform: 'Instagram', status: '进行中', statusBg: 'bg-success/15', statusColor: 'text-success', sent: '32/89', actions: [{ label: '编辑模板', color: 'text-primary' }, { label: '暂停', color: 'text-error' }] },
];

export function AcquisitionPage() {
  const [tab, setTab] = useState<'tasks' | 'prospects' | 'campaigns'>('tasks');
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">获客中心</h1>
          <p className="text-sm text-on-surface-variant mt-1">跨平台潜客发现、AI 意向评分、触达活动管理</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-surface rounded-lg shadow-card p-5 cursor-pointer hover:shadow-float transition-shadow">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 ${m.iconBg} rounded-md flex items-center justify-center`}><Icon className={`w-4 h-4 ${m.iconColor}`} /></div>
                <span className="text-sm text-on-surface-variant">{m.label}</span>
              </div>
              <div className="text-2xl font-bold text-on-surface">{m.value}</div>
              <div className={`text-xs ${m.subColor} mt-1`}>{m.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 bg-surface-container rounded-md p-1 w-fit mb-5">
        {(['tasks', 'prospects', 'campaigns'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === t ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            {t === 'tasks' ? '任务管理' : t === 'prospects' ? '潜客库' : '触达活动'}
          </button>
        ))}
      </div>

      {tab === 'tasks' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-on-surface-variant">共 {tasks.length} 个任务</span>
            <button onClick={() => showToast('创建任务功能开发中')} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />创建任务
            </button>
          </div>
          <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            <div className="grid grid-cols-6 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              <span>任务名</span><span>平台</span><span>状态</span><span>潜客数</span><span>创建时间</span><span>操作</span>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {tasks.map((t, i) => (
                <div key={i} className="grid grid-cols-6 px-4 py-3 hover:bg-surface-container/50 transition-colors items-center">
                  <span className="text-sm font-medium text-on-surface">{t.name}</span>
                  <span className="text-sm text-on-surface-variant">{t.platform}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${t.statusBg} ${t.statusColor} w-fit`}>{t.status}</span>
                  <span className={`text-sm ${t.prospects === '—' ? 'text-on-surface-variant' : 'text-on-surface font-semibold'}`}>{t.prospects}</span>
                  <span className="text-sm text-on-surface-variant">{t.time}</span>
                  <div className="flex gap-3">
                    {t.actions.map((a) => (
                      <button key={a.label} className={`text-sm font-medium hover:underline ${a.color}`}>{a.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'prospects' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <select className="bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer">
              <option value="">全部平台</option><option>小红书</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>抖音</option>
            </select>
            <select className="bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer">
              <option value="">全部意向等级</option><option>高意向</option><option>中意向</option><option>低意向</option>
            </select>
            <select className="bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer">
              <option value="">全部状态</option><option>新潜客</option><option>已评分</option><option>已触达</option><option>已排除</option>
            </select>
            <div className="ml-auto">
              <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />导出
              </button>
            </div>
          </div>
          <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            <div className="grid grid-cols-6 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              <span>用户名</span><span>平台</span><span>互动类型</span><span>意向评分</span><span>状态</span><span>操作</span>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {prospects.map((p, i) => (
                <div key={i} className="grid grid-cols-6 px-4 py-3 hover:bg-surface-container/50 transition-colors items-center">
                  <span className="text-sm font-medium text-on-surface">{p.name}</span>
                  <span className="text-sm text-on-surface-variant">{p.platform}</span>
                  <span className="text-sm text-on-surface-variant">{p.interaction}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div className={`h-full ${p.scoreBarColor} rounded-full`} style={{ width: `${p.score}%` }} />
                    </div>
                    <span className={`text-sm font-semibold ${p.scoreColor}`}>{p.score}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${p.statusBg} ${p.statusColor} w-fit`}>{p.status}</span>
                  <div className="flex gap-3">
                    <button className="text-primary text-sm font-medium hover:underline">详情</button>
                    <button className="text-primary text-sm font-medium hover:underline">{p.status === '已排除' ? '恢复' : '加入触达'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'campaigns' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-on-surface-variant">共 {campaigns.length} 个活动</span>
            <button onClick={() => showToast('创建触达功能开发中')} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />创建触达
            </button>
          </div>
          <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            <div className="grid grid-cols-5 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              <span>活动名</span><span>平台</span><span>状态</span><span>发送数</span><span>操作</span>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {campaigns.map((c, i) => (
                <div key={i} className="grid grid-cols-5 px-4 py-3 hover:bg-surface-container/50 transition-colors items-center">
                  <span className="text-sm font-medium text-on-surface">{c.name}</span>
                  <span className="text-sm text-on-surface-variant">{c.platform}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${c.statusBg} ${c.statusColor} w-fit`}>{c.status}</span>
                  <span className="text-sm text-on-surface font-semibold">{c.sent}</span>
                  <div className="flex gap-3">
                    {c.actions.map((a) => (
                      <button key={a.label} className={`text-sm font-medium hover:underline ${a.color}`}>{a.label}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="bg-surface rounded-lg shadow-float px-4 py-3 flex items-center gap-2 text-sm font-medium text-on-surface border border-outline-variant/20">
            <CheckCircle className="w-4 h-4 text-success" /><span>{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
