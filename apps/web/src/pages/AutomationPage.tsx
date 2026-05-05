import { useState } from 'react';
import {
  PlayCircle,
  Clock,
  PauseCircle,
  Activity,
  PlusCircle,
  BarChart3,
  UserSearch,
  MessageCircle,
  FileSpreadsheet,
  Pencil,
  Trash2,
  ScrollText,
  Check,
  Zap,
  CalendarClock,
  MessageSquare,
  CheckCircle,
} from 'lucide-react';

const stats = [
  { label: '运行中', value: '3', icon: PlayCircle, iconColor: 'text-success' },
  { label: '待审核', value: '1', icon: Clock, iconColor: 'text-warning' },
  { label: '已暂停', value: '0', icon: PauseCircle, iconColor: 'text-on-surface-variant' },
  { label: '今日执行', value: '12', icon: Activity, iconColor: 'text-primary' },
];

interface Automation {
  id: string; name: string; schedule: string; desc: string; icon: typeof BarChart3; iconBg: string; iconColor: string;
  status: string; statusBg: string; statusColor: string; dotColor: string; enabled: boolean;
}
const automations: Automation[] = [
  { id: 'auto-1', name: '每天9点汇总媒体数据', schedule: '定时 · 每天 09:00', desc: '自动汇总各平台媒体运营数据，生成日报', icon: BarChart3, iconBg: 'bg-primary/10', iconColor: 'text-primary', status: '运行中', statusBg: 'bg-success/15', statusColor: 'text-success', dotColor: 'bg-success', enabled: true },
  { id: 'auto-2', name: '每2小时扫描高意向用户', schedule: '定时 · 每 2 小时', desc: '自动扫描获客平台，识别高意向潜客', icon: UserSearch, iconBg: 'bg-success/10', iconColor: 'text-success', status: '运行中', statusBg: 'bg-success/15', statusColor: 'text-success', dotColor: 'bg-success', enabled: true },
  { id: 'auto-3', name: '好友自动消息', schedule: '事件 · 新好友添加时', desc: '新好友添加时自动发送欢迎消息', icon: MessageCircle, iconBg: 'bg-warning/10', iconColor: 'text-warning', status: '待审核', statusBg: 'bg-warning/15', statusColor: 'text-warning', dotColor: 'bg-warning', enabled: true },
  { id: 'auto-4', name: '媒体草稿每日汇总', schedule: '定时 · 每天 18:00', desc: '每日汇总待审核草稿，推送审核提醒', icon: FileSpreadsheet, iconBg: 'bg-primary/10', iconColor: 'text-primary', status: '运行中', statusBg: 'bg-success/15', statusColor: 'text-success', dotColor: 'bg-success', enabled: true },
];

export function AutomationPage() {
  const [triggerType, setTriggerType] = useState<'timed' | 'event'>('timed');
  const [actionType, setActionType] = useState<'data-summary' | 'message-gen' | 'content-schedule'>('data-summary');
  const [ruleName, setRuleName] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(Object.fromEntries(automations.map((a) => [a.id, a.enabled])));

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">自动化</h1>
          <p className="text-sm text-on-surface-variant mt-1">配置定时自动化任务，让 AI 按规则执行运营动作</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-surface rounded-lg shadow-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${s.iconColor}`} />
                <span className="text-xs font-medium text-on-surface-variant">{s.label}</span>
              </div>
              <p className="text-2xl font-bold text-on-surface">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-surface rounded-lg shadow-card overflow-hidden mb-8">
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
          <span className="col-span-4">规则名称</span>
          <span className="col-span-3">描述</span>
          <span className="col-span-2">状态</span>
          <span className="col-span-3 text-right">操作</span>
        </div>
        <div className="divide-y divide-outline-variant/50">
          {automations.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-surface-container/50 transition-colors items-center">
                <div className="col-span-4 flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-md ${a.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${a.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-on-surface">{a.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{a.schedule}</p>
                  </div>
                </div>
                <div className="col-span-3"><p className="text-sm text-on-surface-variant">{a.desc}</p></div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${a.statusBg} ${a.statusColor}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${a.dotColor} mr-1.5`} />{a.status}
                  </span>
                </div>
                <div className="col-span-3 flex items-center justify-end gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enabledMap[a.id]}
                      onChange={(e) => setEnabledMap((prev) => ({ ...prev, [a.id]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-surface-container-high rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                  <button className="p-1.5 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface" title="执行日志"><ScrollText className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface" title="编辑"><Pencil className="w-4 h-4" /></button>
                  <button className="p-1.5 rounded-md hover:bg-surface-container transition-colors text-on-surface-variant hover:text-error" title="删除"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New automation form */}
      <div className="bg-surface rounded-lg shadow-card p-5">
        <div className="flex items-center gap-2 mb-5">
          <PlusCircle className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-on-surface">新建自动化</h2>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">规则名称</label>
            <input
              type="text"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
              placeholder='输入自动化规则名称，如"每日数据汇总"'
              className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">触发条件</label>
            <div className="flex gap-3">
              {([
                { key: 'timed' as const, icon: Clock, label: '定时触发', desc: '按固定时间间隔自动执行' },
                { key: 'event' as const, icon: Zap, label: '事件触发', desc: '特定事件发生时自动执行' },
              ]).map((t) => (
                <label key={t.key} className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${triggerType === t.key ? 'border-primary bg-primary/5' : 'border-outline-variant/30'}`} onClick={() => setTriggerType(t.key)}>
                  <div className="flex items-center gap-2 mb-1">
                    <t.icon className={`w-4 h-4 ${triggerType === t.key ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <span className="text-sm font-medium text-on-surface">{t.label}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{t.desc}</p>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">执行动作</label>
            <div className="flex gap-3">
              {([
                { key: 'data-summary' as const, icon: BarChart3, label: '数据汇总', desc: '汇总运营数据生成报告' },
                { key: 'message-gen' as const, icon: MessageSquare, label: '消息生成', desc: '自动生成回复或推送消息' },
                { key: 'content-schedule' as const, icon: CalendarClock, label: '内容排期', desc: '自动排期发布内容' },
              ]).map((a) => (
                <label key={a.key} className={`flex-1 border-2 rounded-lg p-4 cursor-pointer transition-all ${actionType === a.key ? 'border-primary bg-primary/5' : 'border-outline-variant/30'}`} onClick={() => setActionType(a.key)}>
                  <div className="flex items-center gap-2 mb-1">
                    <a.icon className={`w-4 h-4 ${actionType === a.key ? 'text-primary' : 'text-on-surface-variant'}`} />
                    <span className="text-sm font-medium text-on-surface">{a.label}</span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{a.desc}</p>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button onClick={() => showToast('自动化规则已保存')} className="bg-primary text-on-primary px-5 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <Check className="w-4 h-4" />保存
            </button>
            <button onClick={() => setRuleName('')} className="bg-surface-container text-on-surface px-5 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all">取消</button>
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
