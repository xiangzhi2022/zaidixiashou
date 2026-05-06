import { AlertTriangle, Check, X, CheckCheck, CheckCircle } from 'lucide-react';
import { useState } from 'react';

type TabType = 'pending' | 'history';

const pendingItems = [
  { id: 'APR-001', name: '发布旅行收纳小红书图文', desc: 'AI 生成的图文内容，目标平台：小红书', type: '发布', typeBg: 'bg-primary/10', typeColor: 'text-primary', risk: '高风险', riskBg: 'bg-error/15', riskColor: 'text-error', time: '2025-01-15 14:30' },
  { id: 'APR-002', name: '发送326条好友消息', desc: '批量触达活动，目标平台：小红书', type: '触达', typeBg: 'bg-warning/10', typeColor: 'text-warning', risk: '高风险', riskBg: 'bg-error/15', riskColor: 'text-error', time: '2025-01-15 13:15' },
  { id: 'APR-003', name: '回复64条评论和私信', desc: 'AI 自动回复，目标平台：抖音/小红书', type: '回复', typeBg: 'bg-success/10', typeColor: 'text-success', risk: '中风险', riskBg: 'bg-warning/15', riskColor: 'text-warning', time: '2025-01-15 11:42' },
];

const historyItems = [
  { name: '发布冬季穿搭笔记', desc: 'AI 生成的图文内容，目标平台：小红书', type: '发布', typeBg: 'bg-primary/10', typeColor: 'text-primary', risk: '高风险', riskBg: 'bg-error/15', riskColor: 'text-error', time: '2025-01-14 16:20', result: '已批准', resultBg: 'bg-success/15', resultColor: 'text-success', handler: '小初' },
  { name: '批量发送促销私信', desc: '批量触达活动，目标平台：抖音', type: '触达', typeBg: 'bg-warning/10', typeColor: 'text-warning', risk: '高风险', riskBg: 'bg-error/15', riskColor: 'text-error', time: '2025-01-14 10:05', result: '已驳回', resultBg: 'bg-error/15', resultColor: 'text-error', handler: '小初' },
  { name: '回复8条评论', desc: 'AI 自动回复，目标平台：小红书', type: '回复', typeBg: 'bg-success/10', typeColor: 'text-success', risk: '中风险', riskBg: 'bg-warning/15', riskColor: 'text-warning', time: '2025-01-13 22:30', result: '已批准', resultBg: 'bg-success/15', resultColor: 'text-success', handler: '小初' },
];

export function SettingsApprovalPage() {
  const [tab, setTab] = useState<TabType>('pending');
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">审批</h1>
          <p className="text-sm text-on-surface-variant mt-1">确认 AI 准备执行的高风险操作</p>
        </div>
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-error/15 text-error">
          <AlertTriangle className="w-3.5 h-3.5 mr-1" />3 项待审批
        </span>
      </div>

      {/* Tab Switch */}
      <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1 w-fit mb-6">
        <button onClick={() => setTab('pending')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'pending' ? 'bg-surface text-on-surface shadow-card' : 'text-on-surface-variant hover:text-on-surface'}`}>
          待审批<span className="ml-1.5 inline-flex items-center justify-center bg-error text-white text-xs rounded-full w-5 h-5 leading-none">3</span>
        </button>
        <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${tab === 'history' ? 'bg-surface text-on-surface shadow-card' : 'text-on-surface-variant hover:text-on-surface'}`}>
          审批历史
        </button>
      </div>

      {tab === 'pending' && (
        <div>
          <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
              <div className="col-span-1 flex items-center"><input type="checkbox" className="w-4 h-4 rounded accent-primary cursor-pointer" /></div>
              <span className="col-span-4">操作名称</span>
              <span className="col-span-1">类型</span>
              <span className="col-span-2">风险等级</span>
              <span className="col-span-2">创建时间</span>
              <span className="col-span-2 text-right">操作</span>
            </div>
            <div className="divide-y divide-outline-variant/50">
              {pendingItems.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-surface-container/50 transition-colors items-center">
                  <div className="col-span-1 flex items-center"><input type="checkbox" className="w-4 h-4 rounded accent-primary cursor-pointer" /></div>
                  <div className="col-span-4">
                    <p className="text-sm font-medium text-on-surface">{item.name}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                  </div>
                  <div className="col-span-1"><span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${item.typeBg} ${item.typeColor}`}>{item.type}</span></div>
                  <div className="col-span-2"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.riskBg} ${item.riskColor}`}><AlertTriangle className="w-3 h-3 mr-1" />{item.risk}</span></div>
                  <div className="col-span-2"><span className="text-sm text-on-surface-variant">{item.time}</span></div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <button onClick={() => showToast(`已批准: ${item.name}`)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-success/10 text-success hover:bg-success/20 active:scale-[0.98] transition-all"><Check className="w-3.5 h-3.5" />批准</button>
                    <button onClick={() => showToast(`已驳回: ${item.name}`)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-error/10 text-error hover:bg-error/20 active:scale-[0.98] transition-all"><X className="w-3.5 h-3.5" />驳回</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 bg-surface rounded-lg shadow-card px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded accent-primary cursor-pointer" />
              <span className="text-sm text-on-surface-variant">全选</span>
            </div>
            <button onClick={() => showToast('已批量批准所有待审批项')} className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-success/10 text-success hover:bg-success/20 active:scale-[0.98] transition-all">
              <CheckCheck className="w-4 h-4" />批量批准
            </button>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-surface rounded-lg shadow-card overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface-container text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
            <span className="col-span-4">操作名称</span>
            <span className="col-span-1">类型</span>
            <span className="col-span-2">风险等级</span>
            <span className="col-span-2">处理时间</span>
            <span className="col-span-2">结果</span>
            <span className="col-span-1">处理人</span>
          </div>
          <div className="divide-y divide-outline-variant/50">
            {historyItems.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-surface-container/50 transition-colors items-center">
                <div className="col-span-4">
                  <p className="text-sm font-medium text-on-surface">{item.name}</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.desc}</p>
                </div>
                <div className="col-span-1"><span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${item.typeBg} ${item.typeColor}`}>{item.type}</span></div>
                <div className="col-span-2"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.riskBg} ${item.riskColor}`}>{item.risk}</span></div>
                <div className="col-span-2"><span className="text-sm text-on-surface-variant">{item.time}</span></div>
                <div className="col-span-2"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${item.resultBg} ${item.resultColor}`}>{item.result}</span></div>
                <div className="col-span-1"><span className="text-sm text-on-surface-variant">{item.handler}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-on-surface text-on-primary shadow-lg animate-[fadeInUp_0.3s_ease]">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </>
  );
}
