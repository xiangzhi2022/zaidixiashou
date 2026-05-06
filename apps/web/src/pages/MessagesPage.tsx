import { useState } from 'react';
import {
  RefreshCw,
  Search,
  ShoppingBag,
  Music,
  Camera,
  AlertTriangle,
  Sparkles,
  Languages,
  MessageCircle,
  Wand2,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

interface Message {
  id: string;
  category: string;
  title: string;
  platform: string;
  platformColor: string;
  PlatformIcon: typeof ShoppingBag;
  platformIconColor: string;
  desc: string;
  waitTime: string;
  waitColor: string;
  tags: { label: string; bg: string; color: string }[];
}

const messages: Message[] = [
  {
    id: 'msg-001', category: 'buyer', title: '买家物流投诉', platform: 'eBay',
    platformColor: 'bg-[#e53238]/10', PlatformIcon: ShoppingBag, platformIconColor: 'text-[#e53238]',
    desc: 'eBay · 订单 #2024-0518 · 物流停滞已12天',
    waitTime: '等待 1h14min', waitColor: 'text-error',
    tags: [{ label: '紧急', bg: 'bg-error/15', color: 'text-error' }, { label: '待回复', bg: 'bg-warning/15', color: 'text-warning' }],
  },
  {
    id: 'msg-002', category: 'buyer', title: '买家问尺寸', platform: 'TikTok Shop',
    platformColor: 'bg-[#010101]/10', PlatformIcon: Music, platformIconColor: 'text-[#010101]',
    desc: 'TikTok Shop · 连衣裙SKU-0832 · 高意向咨询',
    waitTime: '等待 23min', waitColor: 'text-on-surface-variant',
    tags: [{ label: '高意向', bg: 'bg-success/15', color: 'text-success' }, { label: '待回复', bg: 'bg-warning/15', color: 'text-warning' }],
  },
  {
    id: 'msg-003', category: 'dm', title: '私信问优惠', platform: 'Instagram',
    platformColor: 'bg-[#E4405F]/10', PlatformIcon: Camera, platformIconColor: 'text-[#E4405F]',
    desc: 'Instagram · @sarah_style · 询问批量折扣',
    waitTime: '等待 45min', waitColor: 'text-on-surface-variant',
    tags: [{ label: '可回复', bg: 'bg-primary/15', color: 'text-primary' }],
  },
  {
    id: 'msg-004', category: 'buyer', title: '退货咨询', platform: 'eBay',
    platformColor: 'bg-[#e53238]/10', PlatformIcon: ShoppingBag, platformIconColor: 'text-[#e53238]',
    desc: 'eBay · 订单 #2024-0502 · 颜色不符申请退货',
    waitTime: '等待 2h30min', waitColor: 'text-on-surface-variant',
    tags: [{ label: '中等', bg: 'bg-warning/15', color: 'text-warning' }, { label: '待回复', bg: 'bg-warning/15', color: 'text-warning' }],
  },
  {
    id: 'msg-005', category: 'review', title: '5星好评待回复', platform: 'TikTok Shop',
    platformColor: 'bg-[#010101]/10', PlatformIcon: Music, platformIconColor: 'text-[#010101]',
    desc: 'TikTok Shop · 商品SKU-1120 · 好评感谢回复',
    waitTime: '等待 5h', waitColor: 'text-on-surface-variant',
    tags: [{ label: '低优先', bg: 'bg-success/15', color: 'text-success' }],
  },
];

const aiReplyDraft = `Dear John,

Thank you for reaching out, and I sincerely apologize for the frustrating delay with your order #2024-0518. I completely understand how concerning it is when tracking doesn't update.

I've immediately checked with our shipping carrier, and it appears your package may have encountered a transit issue at a sorting facility. Here's what I'm doing right now:

1. Filed an investigation request with the carrier (response within 24h)
2. If the package is confirmed lost, I'll process a full refund of $348.00 immediately
3. Alternatively, I can ship a replacement today with expedited delivery (2-3 days)

Which option would you prefer? I want to make sure you have what you need for your trip next week.

Best regards,
Customer Service Team`;

export function MessagesPage() {
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [activeMsg, setActiveMsg] = useState<Message | null>(messages[0] ?? null);
  const [replyText, setReplyText] = useState(aiReplyDraft);
  const [approvalSent, setApprovalSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = messages.filter((m) => {
    if (category !== 'all' && m.category !== category) return false;
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.desc.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'buyer', label: '买家咨询' },
    { key: 'review', label: '评价' },
    { key: 'dm', label: '私信' },
  ];

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/15">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-on-surface">消息中心</h1>
          <span className="bg-error/15 text-error text-xs font-medium px-2 py-0.5 rounded-full">64 条待处理</span>
        </div>
        <button className="bg-surface-container text-on-surface px-3 py-1.5 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />刷新
        </button>
      </div>

      <div className="flex" style={{ height: 'calc(100vh - 3.5rem - 57px)' }}>
        {/* Left: Message List */}
        <div className="w-[380px] shrink-0 bg-surface border-r border-outline-variant/15 flex flex-col">
          <div className="flex items-center gap-1 px-4 pt-3 pb-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setCategory(t.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${category === t.key ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant/60" />
              <input
                type="text"
                placeholder="搜索消息..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-container border-none rounded-md pl-8 pr-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((m) => {
              const Icon = m.PlatformIcon;
              return (
                <div
                  key={m.id}
                  onClick={() => { setActiveMsg(m); setApprovalSent(false); }}
                  className={`px-4 py-3 border-b border-outline-variant/15 cursor-pointer hover:bg-surface-container/60 transition-colors ${activeMsg?.id === m.id ? 'bg-primary/5 border-l-2 border-l-primary' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg ${m.platformColor} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-4 h-4 ${m.platformIconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-on-surface truncate">{m.title}</span>
                        <span className={`text-xs ${m.waitColor} font-medium whitespace-nowrap`}>{m.waitTime}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 truncate">{m.desc}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {m.tags.map((t) => (
                          <span key={t.label} className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium ${t.bg} ${t.color}`}>{t.label}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Message Detail + AI Reply */}
        <div className="flex-1 min-w-0 overflow-y-auto bg-background">
          {activeMsg ? (
          <div className="p-6">
            <div className="bg-surface rounded-lg shadow-card p-5 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${activeMsg.platformColor} flex items-center justify-center`}>
                    <activeMsg.PlatformIcon className={`w-5 h-5 ${activeMsg.platformIconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-on-surface">{activeMsg.title}</h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">{activeMsg.desc} · 来自 user_john_88</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {activeMsg.tags.map((t) => (
                    <span key={t.label} className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${t.bg} ${t.color}`}>{t.label}</span>
                  ))}
                  <span className="text-xs text-on-surface-variant">{activeMsg.waitTime}</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-medium text-on-surface-variant shrink-0">J</div>
                  <div className="bg-surface-container rounded-lg rounded-tl-none px-4 py-3 max-w-lg">
                    <p className="text-sm text-on-surface leading-relaxed">Hi, I ordered a Bluetooth headphone on May 5th and the tracking hasn't updated since May 8th. It's been 12 days with no movement. This is really frustrating, I need this for a trip next week. Can you check what's going on? If it's lost I want a full refund immediately.</p>
                    <p className="text-xs text-on-surface-variant/60 mt-2">2024-05-18 09:23 · eBay Message</p>
                  </div>
                </div>

                <div className="ml-11 bg-warning/5 border border-warning/15 rounded-md px-4 py-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                    <span className="text-xs font-semibold text-warning">AI 风险提示</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">该买家已发起 2 次物流投诉，若 24h 内未回复可能升级为平台纠纷。建议优先处理并安抚情绪。</p>
                </div>

                <div className="ml-11 bg-surface-container/60 rounded-md px-4 py-3">
                  <p className="text-xs font-semibold text-on-surface-variant mb-2">关联订单信息</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                    <div className="flex justify-between"><span className="text-on-surface-variant">订单号</span><span className="text-on-surface font-medium">#2024-0518</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">商品</span><span className="text-on-surface font-medium">Sony WH-1000XM5</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">金额</span><span className="text-on-surface font-medium">$348.00</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">物流单号</span><span className="text-on-surface font-medium">US942138567</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">发货日期</span><span className="text-on-surface font-medium">2024-05-06</span></div>
                    <div className="flex justify-between"><span className="text-on-surface-variant">当前状态</span><span className="text-error font-medium">停滞</span></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Reply */}
            <div className="bg-surface rounded-lg shadow-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-on-surface">AI 回复草稿</h3>
                </div>
                <button onClick={() => showToast('正在重新生成回复...')} className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />重新生成
                </button>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full bg-surface-container border-none rounded-md px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors resize-none"
                rows={6}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => showToast('已翻译为英文')} className="bg-surface-container text-on-surface px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5" />翻译为英文
                  </button>
                  <button onClick={() => showToast('已切换为友好语气')} className="bg-surface-container text-on-surface px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />换语气
                  </button>
                  <button onClick={() => showToast('已优化回复语气')} className="bg-surface-container text-on-surface px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5" />优化语气
                  </button>
                </div>
                {approvalSent ? (
                  <button disabled className="bg-primary/70 text-on-primary px-5 py-2 rounded-md text-sm font-semibold inline-flex items-center gap-1.5 opacity-70 cursor-not-allowed">
                    审批中
                  </button>
                ) : (
                  <button
                    onClick={() => { setApprovalSent(true); showToast('已提交审批，审批通过后将通过 CDP 自动发送'); }}
                    className="bg-primary text-on-primary px-5 py-2 rounded-md text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />放入审批发送
                  </button>
                )}
              </div>
            </div>
          </div>
          ) : (
            <div className="flex items-center justify-center h-full text-on-surface-variant text-sm">请选择一条消息</div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed top-20 right-6 z-50">
          <div className="bg-surface rounded-lg shadow-float px-4 py-3 text-sm text-on-surface inline-flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" /><span>{toast}</span>
          </div>
        </div>
      )}
    </>
  );
}
