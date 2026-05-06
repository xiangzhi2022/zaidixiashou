import { useState } from 'react';
import {
  ShoppingCart,
  AlertTriangle,
  Package,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  ListChecks,
  Search,
  RefreshCw,
  Sparkles,
  Check,
  X,
  AlertCircle,
  CheckCircle,
  ChevronDown,
} from 'lucide-react';

const metricCards = [
  { label: '今日订单', value: '247', icon: ShoppingCart, iconBg: 'bg-primary/10', iconColor: 'text-primary', trend: 'up', trendVal: '+12%', trendColor: 'text-success' },
  { label: '异常订单', value: '18', icon: AlertTriangle, iconBg: 'bg-error/10', iconColor: 'text-error', trend: 'up', trendVal: '+5', trendColor: 'text-error' },
  { label: '待发货', value: '73', icon: Package, iconBg: 'bg-warning/10', iconColor: 'text-warning', trend: 'down', trendVal: '-8', trendColor: 'text-success' },
  { label: '退款请求', value: '6', icon: RotateCcw, iconBg: 'bg-error/10', iconColor: 'text-error', trend: 'flat', trendVal: '持平', trendColor: 'text-on-surface-variant' },
];

interface Order {
  id: string;
  platform: string;
  platformColor: string;
  platformLetter: string;
  platformLetterColor: string;
  status: string;
  statusBg: string;
  statusColor: string;
  amount: string;
  priority: string;
  priorityBg: string;
  priorityColor: string;
  suggest: { title: string; titleColor: string; iconBg: string; iconColor: string; Icon: typeof AlertCircle; desc: string; steps: string[] };
}

const orders: Order[] = [
  {
    id: 'A-10482', platform: 'Amazon', platformColor: 'bg-[#FF9900]/10', platformLetter: 'A', platformLetterColor: 'text-[#FF9900]',
    status: '物流超时', statusBg: 'bg-error/10', statusColor: 'text-error',
    amount: '$128.40', priority: '高', priorityBg: 'bg-error/10', priorityColor: 'text-error',
    suggest: {
      title: '物流超时风险', titleColor: 'text-error', iconBg: 'bg-error/5', iconColor: 'text-error', Icon: AlertCircle,
      desc: '该订单已超过预计送达时间 3 天，物流信息停留在中国海关清关阶段。',
      steps: ['立即联系物流服务商（DHL）查询清关状态，获取预计放行时间', '向买家发送物流延误通知邮件，告知当前状态和预计到达时间', '若 48 小时内未清关完成，建议提供 10% 折扣券作为补偿'],
    },
  },
  {
    id: 'E-87312', platform: 'eBay', platformColor: 'bg-[#E53238]/10', platformLetter: 'E', platformLetterColor: 'text-[#E53238]',
    status: '买家要求退款', statusBg: 'bg-warning/10', statusColor: 'text-warning',
    amount: '$42.90', priority: '高', priorityBg: 'bg-error/10', priorityColor: 'text-error',
    suggest: {
      title: '退款请求分析', titleColor: 'text-warning', iconBg: 'bg-warning/5', iconColor: 'text-warning', Icon: RotateCcw,
      desc: '买家以"商品与描述不符"为由申请退款，该买家历史退款率 8%，低于平台平均。',
      steps: ['查看买家上传的退款凭证照片，对比 Listing 描述确认差异', '同意退款并生成退货标签，预计退款金额 $42.90', '更新 Listing 商品描述和图片，避免类似退款再次发生'],
    },
  },
  {
    id: 'S-22409', platform: 'Shopify', platformColor: 'bg-[#96BF48]/10', platformLetter: 'S', platformLetterColor: 'text-[#96BF48]',
    status: '待发货', statusBg: 'bg-primary-container', statusColor: 'text-primary',
    amount: '$86.00', priority: '中', priorityBg: 'bg-warning/10', priorityColor: 'text-warning',
    suggest: {
      title: '待发货提醒', titleColor: 'text-primary', iconBg: 'bg-primary/5', iconColor: 'text-primary', Icon: Package,
      desc: '订单已超过 24 小时未发货，Shopify 平台建议在 48 小时内发货以维持店铺评分。',
      steps: ['检查库存确认商品可发，优先安排发货', '生成物流面单并标记为已发货，同步物流单号到 Shopify', '发送发货通知邮件给买家，包含物流追踪链接'],
    },
  },
  {
    id: 'TK-8810', platform: 'TikTok Shop', platformColor: 'bg-[#000000]/10', platformLetter: 'TK', platformLetterColor: 'text-[#000000]',
    status: '正常', statusBg: 'bg-success/10', statusColor: 'text-success',
    amount: '$54.20', priority: '低', priorityBg: 'bg-surface-container-high', priorityColor: 'text-on-surface-variant',
    suggest: {
      title: '订单正常', titleColor: 'text-success', iconBg: 'bg-success/5', iconColor: 'text-success', Icon: CheckCircle,
      desc: '订单状态正常，物流信息更新及时，买家未发起任何异常请求。',
      steps: ['持续关注物流状态，预计 3-5 个工作日送达', '在商品妥投后自动发送好评邀请邮件', '建议对该买家推荐相关商品，提升复购率'],
    },
  },
];

export function OrdersPage() {
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [search, setSearch] = useState('');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (filterPlatform !== 'all' && o.platform !== filterPlatform) return false;
    if (filterStatus !== 'all') {
      const statusMap: Record<string, string> = { logistics_timeout: '物流超时', refund: '买家要求退款', pending_shipment: '待发货', normal: '正常' };
      if (o.status !== statusMap[filterStatus]) return false;
    }
    if (filterPriority !== 'all') {
      const priMap: Record<string, string> = { high: '高', medium: '中', low: '低' };
      if (o.priority !== priMap[filterPriority]) return false;
    }
    if (search && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-on-surface">订单工作台</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">集中处理跨平台订单、物流异常和退款</p>
        </div>
        <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
          <ListChecks className="w-3.5 h-3.5" />批量处理
        </button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metricCards.map((m) => {
          const Icon = m.icon;
          const TrendIcon = m.trend === 'up' ? TrendingUp : m.trend === 'down' ? TrendingDown : Minus;
          return (
            <div key={m.label} className="bg-surface rounded-lg shadow-card p-5 hover:shadow-float transition-shadow cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">{m.label}</span>
                <div className={`w-8 h-8 ${m.iconBg} rounded-md flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-on-surface">{m.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendIcon className={`w-3 h-3 ${m.trendColor}`} />
                <span className={`text-xs font-medium ${m.trendColor}`}>{m.trendVal}</span>
                <span className="text-xs text-on-surface-variant ml-1">较昨日</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="bg-surface rounded-lg shadow-card p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="appearance-none bg-surface-container border-none rounded-md pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
            >
              <option value="all">全部平台</option>
              <option value="Amazon">Amazon</option>
              <option value="eBay">eBay</option>
              <option value="Shopify">Shopify</option>
              <option value="TikTok Shop">TikTok Shop</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="appearance-none bg-surface-container border-none rounded-md pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
            >
              <option value="all">全部状态</option>
              <option value="logistics_timeout">物流超时</option>
              <option value="refund">退款</option>
              <option value="pending_shipment">待发货</option>
              <option value="normal">正常</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="appearance-none bg-surface-container border-none rounded-md pl-3 pr-8 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors cursor-pointer"
            >
              <option value="all">全部优先级</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-on-surface-variant absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索订单号 / 买家名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container border-none rounded-md pl-9 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          </div>
          <button
            onClick={() => showToast('订单数据已刷新')}
            className="bg-surface-container text-on-surface-variant px-3 py-2 rounded-md hover:bg-surface-container-high active:scale-[0.98] transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Order table */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden">
        <div className="grid grid-cols-6 px-5 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          <span>订单号</span><span>平台</span><span>状态</span><span>金额</span><span>优先级</span><span>操作</span>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {filtered.map((o) => (
            <div key={o.id} className="grid grid-cols-6 px-5 py-4 hover:bg-surface-container/50 transition-colors items-center">
              <span className="text-sm font-semibold text-on-surface">#{o.id}</span>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 ${o.platformColor} rounded flex items-center justify-center`}>
                  <span className={`text-[10px] font-bold ${o.platformLetterColor}`}>{o.platformLetter}</span>
                </div>
                <span className="text-sm text-on-surface-variant">{o.platform}</span>
              </div>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${o.statusBg} ${o.statusColor} w-fit`}>{o.status}</span>
              <span className="text-sm font-semibold text-on-surface">{o.amount}</span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${o.priorityBg} ${o.priorityColor} w-fit`}>{o.priority}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveOrder(o)}
                  className="bg-primary text-on-primary px-3 py-1.5 rounded-md text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />AI 处理
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-on-surface-variant">没有符合条件的订单</div>
          )}
        </div>
      </div>

      {/* AI Suggest Modal */}
      {activeOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setActiveOrder(null)}>
          <div className="bg-surface rounded-xl shadow-dialog max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-base font-bold text-on-surface">AI 处理建议</h3>
                </div>
                <button onClick={() => setActiveOrder(null)} className="p-1.5 rounded-md hover:bg-surface-container transition-colors">
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>

              <div className="bg-surface-container rounded-lg p-4 mb-4">
                <p className="text-sm text-on-surface-variant mb-1">订单号</p>
                <p className="text-sm font-semibold text-on-surface">#{activeOrder.id}</p>
              </div>

              <div>
                <div className={`${activeOrder.suggest.iconBg} border border-current/10 rounded-lg p-4 mb-3`}>
                  <div className="flex items-center gap-2 mb-2">
                    <activeOrder.suggest.Icon className={`w-4 h-4 ${activeOrder.suggest.iconColor}`} />
                    <span className={`text-sm font-semibold ${activeOrder.suggest.titleColor}`}>{activeOrder.suggest.title}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{activeOrder.suggest.desc}</p>
                </div>
                <p className="text-sm font-semibold text-on-surface mb-2">AI 建议处理步骤：</p>
                <ol className="space-y-2 text-sm text-on-surface-variant">
                  {activeOrder.suggest.steps.map((step, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="shrink-0 w-5 h-5 bg-primary/10 text-primary rounded text-xs flex items-center justify-center font-bold">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-outline-variant/50">
                <button onClick={() => setActiveOrder(null)} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all">取消</button>
                <button
                  onClick={() => { setActiveOrder(null); showToast('已提交审批队列'); }}
                  className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />确认执行
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="bg-surface rounded-lg shadow-float border border-outline-variant/30 px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm font-medium text-on-surface">{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
