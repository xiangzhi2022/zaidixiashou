import { Gift, ArrowUpCircle, Sparkles, Monitor, Target, Code } from 'lucide-react';

const plans = [
  {
    id: 'free',
    name: '免费版',
    price: '¥0',
    current: true,
    badge: '当前套餐',
    badgeBg: 'bg-primary/15',
    badgeColor: 'text-primary',
    features: [
      { icon: Sparkles, label: 'AI 额度', value: '自带 Key 限额 50次/天' },
      { icon: Monitor, label: 'CDP 并发', value: '1 连接' },
      { icon: Target, label: '获客任务', value: '1 任务/月' },
      { icon: Code, label: '平台 API', value: '不包含' },
    ],
  },
  {
    id: 'basic',
    name: '基础版',
    price: '¥99',
    current: false,
    badge: null,
    features: [
      { icon: Sparkles, label: 'AI 额度', value: '平台 API 500次/天' },
      { icon: Monitor, label: 'CDP 并发', value: '2 连接' },
      { icon: Target, label: '获客任务', value: '10 任务/月' },
      { icon: Code, label: '平台 API', value: '包含' },
    ],
  },
  {
    id: 'pro',
    name: '专业版',
    price: '¥299',
    current: false,
    badge: '推荐',
    badgeBg: 'bg-primary',
    badgeColor: 'text-on-primary',
    features: [
      { icon: Sparkles, label: 'AI 额度', value: '平台 API 2,000次/天' },
      { icon: Monitor, label: 'CDP 并发', value: '5 连接' },
      { icon: Target, label: '获客任务', value: '不限' },
      { icon: Code, label: '平台 API', value: '包含' },
    ],
  },
  {
    id: 'enterprise',
    name: '企业版',
    price: '¥799',
    current: false,
    badge: null,
    features: [
      { icon: Sparkles, label: 'AI 额度', value: '平台 API 不限' },
      { icon: Monitor, label: 'CDP 并发', value: '不限' },
      { icon: Target, label: '获客任务', value: '不限' },
      { icon: Code, label: '平台 API', value: '包含 + 优先' },
    ],
  },
];

export function SettingsBillingPage() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface">订阅与账单</h1>
        <p className="text-sm text-on-surface-variant mt-1">管理您的 SaaS 订阅套餐、查看账单和支付记录</p>
      </div>

      {/* Current Plan */}
      <div className="bg-surface rounded-lg shadow-card p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-container rounded-xl flex items-center justify-center"><Gift className="w-6 h-6 text-primary" /></div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-surface-container-high text-on-surface-variant">免费版</span>
              <span className="text-lg font-semibold text-on-surface">免费版</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">永久免费 · 到期时间：无限期</p>
          </div>
        </div>
        <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
          <ArrowUpCircle className="w-3.5 h-3.5" />升级套餐
        </button>
      </div>

      {/* Plan Comparison */}
      <div className="mb-10">
        <h2 className="text-base font-semibold text-on-surface mb-4">套餐对比</h2>
        <div className="grid grid-cols-4 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-surface rounded-lg shadow-card p-5 border-2 relative flex flex-col ${plan.current ? 'border-primary' : 'border-transparent hover:border-outline/20 transition-colors'}`}>
              <div className="mb-4 h-5">
                {plan.badge && <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${plan.badgeBg || ''} ${plan.badgeColor || ''}`}>{plan.badge}</span>}
              </div>
              <h3 className="text-base font-semibold text-on-surface mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-bold text-on-surface">{plan.price}</span>
                <span className="text-xs text-on-surface-variant">/月</span>
              </div>
              <div className="space-y-3 flex-1">
                {plan.features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-on-surface-variant mt-0.5 shrink-0" />
                      <div><p className="text-sm text-on-surface font-medium">{f.label}</p><p className="text-xs text-on-surface-variant">{f.value}</p></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5">
                {plan.current ? (
                  <button className="w-full bg-surface-container text-on-surface-variant px-4 py-2 rounded-md text-sm font-medium cursor-default" disabled>当前套餐</button>
                ) : (
                  <button className="w-full bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all">升级</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
