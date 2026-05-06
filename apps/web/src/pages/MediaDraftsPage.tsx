import {
  CheckCheck,
  RefreshCw,
  FileText,
  Eye,
  Wrench,
  AlignLeft,
  Pencil,
  ClipboardCheck,
  ShieldCheck,
  Image,
  Type,
  CheckCircle2,
  Ban,
  Send,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';

const drafts = [
  {
    id: 'draft-1',
    title: '旅行收纳清单',
    platform: '小红书',
    platformColor: 'bg-primary/10 text-primary',
    preview: '出行必备收纳技巧，10 个神器让行李箱整整齐齐…',
    status: '素材完整',
    statusBg: 'bg-success/15',
    statusColor: 'text-success',
    borderClass: 'border-outline-variant/30',
  },
  {
    id: 'draft-2',
    title: '行李箱整理对比',
    platform: 'TikTok',
    platformColor: 'bg-error/10 text-error',
    preview: 'Before vs After 行李箱整理挑战，收纳达人必备…',
    status: '缺封面',
    statusBg: 'bg-warning/15',
    statusColor: 'text-warning',
    borderClass: 'border-warning/20 bg-warning/5',
  },
  {
    id: 'draft-3',
    title: 'Weekend bag reset',
    platform: 'Instagram',
    platformColor: 'bg-purple-500/10 text-purple-600',
    preview: 'Weekend bag reset 🎒 What I pack for a quick getaway…',
    status: '待确认',
    statusBg: 'bg-surface-container-high',
    statusColor: 'text-on-surface-variant',
    borderClass: 'border-outline-variant/30',
  },
];

const checks = [
  { label: '敏感词检查', status: '通过', statusColor: 'text-success', bg: 'bg-success/5 border-success/20', iconBg: 'bg-success/15', icon: ShieldCheck, iconColor: 'text-success', desc: '未检测到敏感词汇，内容安全合规', pass: true },
  { label: '图片尺寸', status: '需处理', statusColor: 'text-warning', bg: 'bg-warning/5 border-warning/20', iconBg: 'bg-warning/15', icon: Image, iconColor: 'text-warning', desc: '封面图尺寸 800×600 不符合小红书推荐比例 3:4，建议裁剪或替换', pass: false },
  { label: '文字字数', status: '通过', statusColor: 'text-success', bg: 'bg-success/5 border-success/20', iconBg: 'bg-success/15', icon: Type, iconColor: 'text-success', desc: '正文 186 字，符合小红书推荐范围', pass: true },
  { label: '违禁品检查', status: '通过', statusColor: 'text-success', bg: 'bg-success/5 border-success/20', iconBg: 'bg-success/15', icon: Ban, iconColor: 'text-success', desc: '未涉及违禁品相关信息', pass: true },
];

export function MediaDraftsPage() {
  const [selectedDraft, setSelectedDraft] = useState('draft-1');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-on-surface">草稿审核发布</h1>
          <p className="text-sm text-on-surface-variant mt-1">预览草稿内容，审核检查后发布到各平台</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => showToast('已批量审核通过')} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
            <CheckCheck className="w-3.5 h-3.5" />批量审核通过
          </button>
          <button onClick={() => showToast('草稿列表已刷新')} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" />刷新
          </button>
        </div>
      </div>

      {/* Draft List */}
      <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-on-surface inline-flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />待审核草稿
          </h2>
          <span className="text-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">共 3 条</span>
        </div>
        <div className="space-y-3">
          {drafts.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDraft(d.id)}
              className={`flex items-center gap-4 p-4 rounded-lg border hover:bg-surface-container/30 transition-colors cursor-pointer ${d.borderClass} ${selectedDraft === d.id ? 'ring-2 ring-primary/30' : ''}`}
            >
              <div className="w-16 h-16 rounded-md overflow-hidden shrink-0 bg-surface-container" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-on-surface truncate">{d.title}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${d.platformColor}`}>{d.platform}</span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">{d.preview}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${d.statusBg} ${d.statusColor}`}>{d.status}</span>
                <button onClick={() => showToast('预览功能开发中')} className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />预览</button>
                <button onClick={() => showToast('正在补全素材...')} className="text-on-surface-variant text-sm font-medium hover:text-on-surface hover:underline inline-flex items-center gap-1"><Wrench className="w-3.5 h-3.5" />补素材</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview + Checklist */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Preview */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-on-surface inline-flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-primary" />预览文案
            </h2>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">小红书</span>
              <button onClick={() => showToast('编辑功能开发中')} className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />编辑</button>
            </div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">标题</label>
            <div className="bg-surface-container rounded-md px-3 py-2 text-sm text-on-surface">旅行收纳清单 ✈️ 10个神器让行李箱整整齐齐！</div>
          </div>
          <div className="mb-3">
            <label className="text-xs font-medium text-on-surface-variant mb-1.5 block">正文内容</label>
            <div className="bg-surface-container rounded-md px-3 py-2.5 text-sm text-on-surface leading-relaxed">
              <p>出行收纳真的是一门学问！每次打包都像玩俄罗斯方块🧱</p>
              <p className="mt-2">今天给大家整理了 10 个超实用的旅行收纳好物，从此告别行李箱灾难👇</p>
              <p className="mt-2">1️⃣ 压缩收纳袋 — 衣服体积瞬间减半<br />2️⃣ 分格洗漱包 — 瓶瓶罐罐不再乱滚<br />3️⃣ 数据线收纳卷 — 告别线缆纠缠<br />4️⃣ 鞋袋分隔包 — 鞋衣分离更卫生<br />5️⃣ 内衣分隔包 — 私密物品妥妥的</p>
              <p className="mt-2 text-primary">#旅行收纳 #行李箱整理 #出行必备 #收纳好物 #旅行神器</p>
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="bg-surface rounded-lg shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-on-surface inline-flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-primary" />审核清单
            </h2>
            <button onClick={() => showToast('重新检查完成')} className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1"><RefreshCw className="w-3.5 h-3.5" />重新检查</button>
          </div>
          <div className="space-y-3">
            {checks.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.label} className={`flex items-center gap-3 p-3 rounded-lg border ${c.bg}`}>
                  <div className={`w-8 h-8 rounded-full ${c.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${c.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">{c.label}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.statusColor}`}>{c.status}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{c.desc}</p>
                  </div>
                  {c.pass ? <CheckCircle2 className="w-5 h-5 text-success shrink-0" /> : (
                    <button onClick={() => showToast('正在自动修复图片尺寸...')} className="text-warning text-xs font-medium hover:underline inline-flex items-center gap-1 shrink-0"><Wrench className="w-3 h-3" />修复</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Publish Actions */}
          <div className="mt-6 pt-4 border-t border-outline-variant/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-on-surface">发布目标平台</span>
            </div>
            <div className="flex gap-2 mb-4">
              {['小红书', '抖音', 'TikTok', 'Instagram'].map((p) => (
                <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked={p === '小红书'} className="w-4 h-4 accent-primary rounded" />
                  <span className="text-sm text-on-surface">{p}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => showToast('已设置定时发布')} className="flex-1 bg-surface-container text-on-surface px-4 py-2.5 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />定时发布
              </button>
              <button onClick={() => showToast('已提交发布')} className="flex-1 bg-primary text-on-primary px-4 py-2.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5">
                <Send className="w-3.5 h-3.5" />立即发布
              </button>
            </div>
          </div>
        </div>
      </div>

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
