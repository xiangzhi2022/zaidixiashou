import {
  Bot,
  AlertTriangle,
  Hand,
  GitBranch,
  Zap,
  Check,
  ShieldAlert,
  Settings2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const autoActions = [
  { id: 'draft', label: '生成草稿', desc: '自动生成内容草稿，不直接发布', checked: true },
  { id: 'summary', label: '数据汇总', desc: '自动汇总运营数据和报表', checked: true },
  { id: 'schedule', label: '内容排期', desc: '自动安排内容发布计划', checked: true },
  { id: 'notify', label: '提醒通知', desc: '自动发送运营提醒和通知', checked: true },
];

const approvalActions = [
  { id: 'publish', label: '发布内容', desc: '发布到各平台的内容需审批确认', checked: true },
  { id: 'message', label: '发送私信', desc: '向用户发送私信需审批确认', checked: true },
  { id: 'refund', label: '退款处理', desc: '订单退款操作需审批确认', checked: true },
  { id: 'price', label: '改价操作', desc: '修改商品价格需审批确认', checked: true },
  { id: 'export', label: '批量导出', desc: '批量导出数据需审批确认', checked: true },
];

const logs = [
  { icon: CheckCircle, iconBg: 'bg-success/10', iconColor: 'text-success', title: '审批通过发布小红书图文', desc: 'AI 生成草稿 → 审批通过 → 已发布至小红书', time: '2 分钟前' },
  { icon: XCircle, iconBg: 'bg-error/10', iconColor: 'text-error', title: '驳回批量发送促销私信', desc: '触达频率过高 → 驳回', time: '15 分钟前' },
  { icon: Clock, iconBg: 'bg-surface-container', iconColor: 'text-on-surface-variant', title: '生成草稿：旅行收纳清单', desc: 'AI 自动生成图文草稿', time: '30 分钟前' },
];

const modes = [
  { id: 'manual' as const, label: '手动模式', desc: '所有操作由你手动执行，AI 仅提供建议', icon: Hand, iconBg: 'bg-primary/10', iconColor: 'text-primary', badge: '当前', badgeBg: 'bg-primary/10', badgeColor: 'text-primary' },
  { id: 'semi' as const, label: '半自动模式', desc: '低风险操作自动执行，高风险操作需审批', icon: GitBranch, iconBg: 'bg-success/10', iconColor: 'text-success', badge: '推荐', badgeBg: 'bg-success/15', badgeColor: 'text-success' },
  { id: 'full' as const, label: '全自动模式', desc: '所有操作自动执行，无需人工审批', icon: Zap, iconBg: 'bg-error/10', iconColor: 'text-error', badge: '高风险', badgeBg: 'bg-error/15', badgeColor: 'text-error' },
];

export function SettingsAutopilotPage() {
  const [mode, setMode] = useState<'manual' | 'semi' | 'full'>('manual');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center"><Bot className="w-5 h-5" /></div>
        <div>
          <h1 className="text-2xl font-bold text-on-surface">自动托管模式</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">配置 AI 自动运营的风险边界，确保安全可控</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6 flex items-start gap-3">
        <div className="w-6 h-6 bg-warning/20 text-warning rounded-full flex items-center justify-center shrink-0 mt-0.5"><AlertTriangle className="w-3.5 h-3.5" /></div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface">自动托管模式需要风险边界</p>
          <p className="text-sm text-on-surface-variant mt-1">建议先开启半自动：允许生成草稿、排期和提醒，发布、退款、改价等操作仍进入审批</p>
        </div>
        <button onClick={() => showToast('正在跳转到风险边界配置...')} className="bg-error text-white px-4 py-1.5 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all shrink-0">配置边界</button>
      </div>

      {/* Mode Selection */}
      <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
        <h2 className="text-base font-semibold text-on-surface mb-4">托管模式</h2>
        <div className="grid grid-cols-3 gap-3">
          {modes.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.id} onClick={() => setMode(m.id)} className={`relative bg-surface rounded-lg p-4 text-left transition-all active:scale-[0.98] border-2 ${mode === m.id ? 'border-primary' : 'border-outline-variant/20 hover:border-primary/40'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 ${m.iconBg} ${m.iconColor} rounded-md flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
                  <span className={`text-xs font-medium ${m.badgeBg} ${m.badgeColor} px-2 py-0.5 rounded-sm`}>{m.badge}</span>
                </div>
                <p className="text-sm font-semibold text-on-surface">{m.label}</p>
                <p className="text-xs text-on-surface-variant mt-1">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Risk Boundary Config */}
      <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-on-surface">风险边界配置</h2>
            <p className="text-xs text-on-surface-variant mt-1">定义允许自动执行和必须审批的操作范围</p>
          </div>
          <button onClick={() => showToast('编辑配置功能开发中')} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2"><Settings2 className="w-3.5 h-3.5" />编辑配置</button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* Auto actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-success/15 text-success rounded flex items-center justify-center"><Check className="w-3 h-3" /></div>
              <h3 className="text-sm font-semibold text-on-surface">允许自动执行</h3>
            </div>
            <div className="space-y-2">
              {autoActions.map((a) => (
                <label key={a.id} className="flex items-center gap-3 p-3 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors cursor-pointer">
                  <input type="checkbox" defaultChecked={a.checked} className="w-4 h-4 rounded accent-primary" />
                  <div className="flex-1"><span className="text-sm font-medium text-on-surface">{a.label}</span><p className="text-xs text-on-surface-variant">{a.desc}</p></div>
                </label>
              ))}
            </div>
          </div>
          {/* Approval actions */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-error/15 text-error rounded flex items-center justify-center"><ShieldAlert className="w-3 h-3" /></div>
              <h3 className="text-sm font-semibold text-on-surface">必须审批</h3>
            </div>
            <div className="space-y-2">
              {approvalActions.map((a) => (
                <label key={a.id} className="flex items-center gap-3 p-3 bg-surface-container/50 rounded-md hover:bg-surface-container transition-colors cursor-pointer">
                  <input type="checkbox" defaultChecked={a.checked} className="w-4 h-4 rounded accent-error" />
                  <div className="flex-1"><span className="text-sm font-medium text-on-surface">{a.label}</span><p className="text-xs text-on-surface-variant">{a.desc}</p></div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Operation Log */}
      <div className="bg-surface rounded-lg shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-on-surface">操作日志</h2>
          <Link to="/settings/approval" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">查看全部<ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>
        <div className="divide-y divide-outline-variant/30">
          {logs.map((l, i) => {
            const Icon = l.icon;
            return (
              <div key={i} className="flex items-center gap-4 py-3 hover:bg-surface-container/30 transition-colors rounded-md px-2 -mx-2">
                <div className={`w-8 h-8 ${l.iconBg} ${l.iconColor} rounded-full flex items-center justify-center shrink-0`}><Icon className="w-4 h-4" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-on-surface">{l.title}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{l.desc}</p>
                </div>
                <span className="text-xs text-on-surface-variant shrink-0">{l.time}</span>
              </div>
            );
          })}
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
