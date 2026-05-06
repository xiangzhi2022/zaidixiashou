import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Eye,
  FileCheck2,
  TrendingUp,
  Layers,
  PackageSearch,
  MessageSquare,
  BarChart3,
  Users,
  ChevronRight,
  KeyRound,
  Bot,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';

/* ── Mock data ── */
const metrics = [
  {
    id: 'gmv',
    label: '今日 GMV',
    value: '$18,420',
    icon: DollarSign,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    sub: (
      <>
        <TrendingUp className="w-3.5 h-3.5 text-success" />
        <span className="text-xs font-medium text-success">+12.6%</span>
        <span className="text-xs text-on-surface-variant ml-1">较昨日</span>
      </>
    ),
    link: '/commerce/orders',
  },
  {
    id: 'orders',
    label: '待处理订单',
    value: '247',
    icon: ShoppingBag,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    sub: (
      <>
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-error/15 text-error">
          18 异常
        </span>
        <span className="text-xs text-on-surface-variant ml-1">需关注</span>
      </>
    ),
    link: '/commerce/orders',
  },
  {
    id: 'views',
    label: '今日浏览量',
    value: '182,420',
    icon: Eye,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    sub: (
      <>
        <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
        <span className="text-xs text-on-surface-variant">四平台汇总</span>
      </>
    ),
    link: '/media/center',
  },
  {
    id: 'media',
    label: '媒体待审核',
    value: '4',
    icon: FileCheck2,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    sub: (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium bg-warning/15 text-warning">
        4 待审发布
      </span>
    ),
    link: '/media/drafts',
  },
];

const commerceCards = [
  {
    id: 'orders',
    title: '订单与售后',
    desc: '处理订单、物流、退款',
    icon: ShoppingBag,
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    badge: { text: '18 异常', bg: 'bg-error/15', color: 'text-error' },
    link: '/commerce/orders',
  },
  {
    id: 'products',
    title: '商品与库存',
    desc: 'Listing 管理、库存同步',
    icon: PackageSearch,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    badge: { text: '在线', bg: 'bg-success/15', color: 'text-success' },
    link: '/commerce/products',
  },
  {
    id: 'messages',
    title: '消息中心',
    desc: '买家咨询、评价、私信',
    icon: MessageSquare,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    badge: { text: '64 未读', bg: 'bg-primary/15', color: 'text-primary' },
    link: '/commerce/messages',
  },
];

const mediaCards = [
  {
    id: 'media-data',
    title: '各平台数据榜单',
    desc: '浏览、点赞、收藏、互动率',
    icon: BarChart3,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    badge: { text: '4 平台', bg: 'bg-primary/15', color: 'text-primary' },
    link: '/media/center',
  },
  {
    id: 'interaction',
    title: '互动用户名单',
    desc: '高意向用户追踪与触达',
    icon: Users,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    badge: { text: '326 人', bg: 'bg-success/15', color: 'text-success' },
    link: '/acquisition',
  },
  {
    id: 'drafts',
    title: '草稿审核发布',
    desc: '内容审核、多平台发布',
    icon: FileCheck2,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    badge: { text: '4 待审', bg: 'bg-warning/15', color: 'text-warning' },
    link: '/media/drafts',
  },
];

const platformData = [
  { name: '小红书', color: 'bg-error', views: '68,320', likes: '3,256', saves: '1,842', rate: '7.5%' },
  { name: '抖音', color: 'bg-on-surface', views: '52,100', likes: '5,824', saves: '2,310', rate: '15.6%' },
  { name: 'TikTok', color: 'bg-primary', views: '41,500', likes: '4,210', saves: '1,650', rate: '14.2%' },
  { name: 'Instagram', color: 'bg-warning', views: '20,500', likes: '2,180', saves: '960', rate: '15.3%' },
];

const trendData: Record<string, number[]> = {
  小红书: [45, 60, 40, 75, 85, 95, 100],
  抖音: [50, 55, 70, 65, 80, 90, 85],
  TikTok: [35, 50, 55, 70, 65, 80, 75],
  Instagram: [30, 40, 35, 50, 60, 55, 65],
};

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '今日'];

const interactionUsers = [
  { name: '时尚小仙女', platform: '小红书', platformColor: 'bg-error', type: '评论 + 收藏', intent: '高意向', intentBg: 'bg-error/15', intentColor: 'text-error' },
  { name: 'TechReviewer_Jay', platform: 'TikTok', platformColor: 'bg-primary', type: '点赞 + 关注', intent: '温意向', intentBg: 'bg-warning/15', intentColor: 'text-warning' },
  { name: '居家生活家', platform: 'Instagram', platformColor: 'bg-warning', type: '私信咨询', intent: '高意向', intentBg: 'bg-error/15', intentColor: 'text-error' },
];

const settingsCards = [
  {
    id: 'accounts',
    title: '平台账号管理',
    desc: '管理 Chrome 浏览器连接和平台会话状态',
    icon: KeyRound,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    badge: { text: '3 待连接', bg: 'bg-warning/15', color: 'text-warning' },
    link: '/settings/accounts',
  },
  {
    id: 'autopilot',
    title: '自动托管模式',
    desc: '配置 AI 自动运营的风险边界与审批策略',
    icon: Bot,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    badge: { text: '半自动', bg: 'bg-success/15', color: 'text-success' },
    link: '/settings/autopilot',
  },
  {
    id: 'approval',
    title: '审批',
    desc: '确认 AI 准备执行的高风险操作',
    icon: ShieldCheck,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    badge: { text: '2 待审批', bg: 'bg-warning/15', color: 'text-warning' },
    link: '/settings/approval',
  },
];

export function OverviewPage() {
  const navigate = useNavigate();
  const [trendPlatform, setTrendPlatform] = useState<string | null>(null);

  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">总览</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">跨境电商运营全局看板</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all">
          <RefreshCw className="w-3.5 h-3.5" />
          刷新数据
        </button>
      </div>

      {/* Top 4 metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              onClick={() => navigate(m.link)}
              className="bg-surface rounded-lg shadow-card p-5 cursor-pointer hover:shadow-float transition-shadow group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-on-surface-variant font-medium">{m.label}</span>
                <div className={`w-8 h-8 ${m.iconBg} rounded-md flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-on-surface">{m.value}</div>
              <div className="flex items-center gap-1 mt-2">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Middle: commerce + media card groups */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left: commerce ops */}
        <div>
          <h2 className="text-base font-semibold text-on-surface mb-3">电商运营</h2>
          <div className="space-y-3">
            {commerceCards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(c.link)}
                  className="bg-surface rounded-lg shadow-card p-4 cursor-pointer hover:shadow-float transition-shadow flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${c.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface">{c.title}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{c.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${c.badge.bg} ${c.badge.color}`}>
                      {c.badge.text}
                    </span>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant/50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: media ops */}
        <div>
          <h2 className="text-base font-semibold text-on-surface mb-3">媒体运营</h2>
          <div className="space-y-3">
            {mediaCards.map((c) => {
              const Icon = c.icon;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(c.link)}
                  className="bg-surface rounded-lg shadow-card p-4 cursor-pointer hover:shadow-float transition-shadow flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${c.iconColor}`} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-on-surface">{c.title}</div>
                      <div className="text-xs text-on-surface-variant mt-0.5">{c.desc}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${c.badge.bg} ${c.badge.color}`}>
                      {c.badge.text}
                    </span>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant/50" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: platform data + interaction users */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Left: platform data table */}
        <div>
          <h2 className="text-base font-semibold text-on-surface mb-3">平台数据榜单</h2>
          <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            <div className="grid grid-cols-5 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              <span>平台</span><span>浏览</span><span>点赞</span><span>收藏</span><span>互动率</span>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {platformData.map((p) => (
                <div
                  key={p.name}
                  onClick={() => setTrendPlatform(trendPlatform === p.name ? null : p.name)}
                  className="grid grid-cols-5 px-4 py-3 hover:bg-surface-container/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium text-on-surface flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${p.color} inline-block`} />
                    {p.name}
                  </span>
                  <span className="text-sm text-on-surface-variant">{p.views}</span>
                  <span className="text-sm text-on-surface-variant">{p.likes}</span>
                  <span className="text-sm text-on-surface-variant">{p.saves}</span>
                  <span className="text-sm font-medium text-success">{p.rate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trend panel */}
          {trendPlatform && (
            <div className="mt-3 bg-surface rounded-lg shadow-card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-on-surface">{trendPlatform} 7 日趋势</span>
                <button
                  onClick={() => setTrendPlatform(null)}
                  className="p-1 rounded-md hover:bg-surface-container transition-colors"
                >
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>
              <div className="flex items-end gap-2 h-20">
                {(trendData[trendPlatform] ?? []).map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-primary/20 rounded-sm transition-all"
                      style={{ height: `${val}%` }}
                    />
                    <span className="text-xs text-on-surface-variant">{weekDays[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: interaction users table */}
        <div>
          <h2 className="text-base font-semibold text-on-surface mb-3">互动用户名单</h2>
          <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            <div className="grid grid-cols-5 px-4 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              <span>用户</span><span>平台</span><span>互动类型</span><span>意向标签</span><span>操作</span>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {interactionUsers.map((u, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-5 px-4 py-3 hover:bg-surface-container/50 transition-colors cursor-pointer items-center"
                >
                  <span className="text-sm font-medium text-on-surface">{u.name}</span>
                  <span className="text-sm text-on-surface-variant flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${u.platformColor} inline-block`} />
                    {u.platform}
                  </span>
                  <span className="text-sm text-on-surface-variant">{u.type}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${u.intentBg} ${u.intentColor}`}>
                    {u.intent}
                  </span>
                  <button
                    onClick={() => navigate('/acquisition')}
                    className="text-primary text-sm font-medium hover:underline w-fit"
                  >
                    查看
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: settings shortcuts */}
      <div>
        <h2 className="text-base font-semibold text-on-surface mb-3">系统设置</h2>
        <div className="grid grid-cols-3 gap-4">
          {settingsCards.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                onClick={() => navigate(s.link)}
                className="bg-surface rounded-lg shadow-card p-4 cursor-pointer hover:shadow-float transition-shadow"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-9 h-9 ${s.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
                  </div>
                  <div className="text-sm font-semibold text-on-surface">{s.title}</div>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">{s.desc}</p>
                <div className="flex items-center gap-1 mt-2">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium ${s.badge.bg} ${s.badge.color}`}>
                    {s.badge.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
