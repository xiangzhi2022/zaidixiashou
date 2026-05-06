import { Info, Cloud, KeyRound, Plus, Brain, Sparkles, Globe, Check, Trash2, Plug } from 'lucide-react';
import { useState } from 'react';

const keys = [
  { id: 'key-1', name: 'OpenAI GPT-4o', provider: 'openai', key: 'sk-...4f2a', lastTest: '2 分钟前', status: '默认', statusBg: 'bg-success/15', statusColor: 'text-success', icon: Brain, iconBg: 'bg-success/10', iconColor: 'text-success' },
  { id: 'key-2', name: 'Anthropic Claude', provider: 'anthropic', key: 'sk-ant-...8d3e', lastTest: '尚未测试', status: '待测试', statusBg: 'bg-surface-container-high', statusColor: 'text-on-surface-variant', icon: Sparkles, iconBg: 'bg-surface-container', iconColor: 'text-on-surface-variant' },
  { id: 'key-3', name: '自定义端点', provider: 'custom', key: 'https://api.custom...com', lastTest: '1 小时前', status: '测试失败', statusBg: 'bg-error/15', statusColor: 'text-error', icon: Globe, iconBg: 'bg-error/10', iconColor: 'text-error' },
];

export function SettingsAIModelsPage() {
  const [apiSource, setApiSource] = useState<'platform' | 'ownkey'>('platform');

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-on-surface">AI 模型设置</h1>
        <p className="text-sm text-on-surface-variant mt-1">配置 AI 模型接入方式，支持平台 API 或自带 Key 双模式</p>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-on-surface">选择 AI 调用方式</p>
          <p className="text-xs text-on-surface-variant mt-1">使用平台 API 可享受订阅额度，无需自行管理密钥；自带 Key 则不计入平台配额，适合有自有 API 资源的用户。各功能模块可随时切换调用方式。</p>
        </div>
      </div>

      {/* API Source Selection */}
      <div className="mb-8">
        <h2 className="text-base font-semibold text-on-surface mb-3">API 来源</h2>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setApiSource('platform')} className={`relative bg-surface rounded-lg shadow-card p-5 text-left transition-all border-2 cursor-pointer ${apiSource === 'platform' ? 'border-primary' : 'border-transparent hover:border-outline-variant/30'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Cloud className="w-5 h-5 text-primary" /></div>
              <div><p className="text-sm font-semibold text-on-surface">平台 API</p><p className="text-xs text-on-surface-variant">使用平台提供的 AI 额度</p></div>
            </div>
            <p className="text-xs text-on-surface-variant">无需配置密钥，按订阅套餐享受对应额度</p>
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center">
              {apiSource === 'platform' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          </button>
          <button onClick={() => setApiSource('ownkey')} className={`relative bg-surface rounded-lg shadow-card p-5 text-left transition-all border-2 cursor-pointer ${apiSource === 'ownkey' ? 'border-primary' : 'border-transparent hover:border-outline-variant/30'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center"><KeyRound className="w-5 h-5 text-on-surface-variant" /></div>
              <div><p className="text-sm font-semibold text-on-surface">自带 Key</p><p className="text-xs text-on-surface-variant">使用自己的 API 密钥</p></div>
            </div>
            <p className="text-xs text-on-surface-variant">填入自己的 API Key，不计入平台配额</p>
            <div className="absolute top-4 right-4 w-5 h-5 rounded-full border-2 border-outline-variant/40 flex items-center justify-center">
              {apiSource === 'ownkey' && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
            </div>
          </button>
        </div>
      </div>

      {/* Platform API Panel */}
      {apiSource === 'platform' && (
        <div>
          <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-on-surface">AI 额度使用</h3>
              <span className="text-xs text-on-surface-variant">当前套餐：基础版</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-on-surface">今日已用 <span className="font-semibold text-on-surface">320</span> 次 / 500 次</span>
              <span className="text-sm font-semibold text-warning">64%</span>
            </div>
            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-warning rounded-full transition-all" style={{ width: '64%' }} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-on-surface-variant">剩余 180 次 · 每日额度将于 00:00 重置</span>
              <a href="#" className="text-xs text-primary font-medium hover:underline">升级套餐</a>
            </div>
          </div>
          <div className="bg-warning/8 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-on-surface">额度即将用尽</p>
              <p className="text-xs text-on-surface-variant mt-1">今日 AI 额度已使用 64%，建议升级套餐或切换为自带 Key 模式以避免服务中断。</p>
            </div>
          </div>
        </div>
      )}

      {/* Own Key Panel */}
      {apiSource === 'ownkey' && (
        <div>
          <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-on-surface">已保存的 Key</h3>
              <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />添加 Key
              </button>
            </div>
            <div className="space-y-3">
              {keys.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.id} className="bg-surface-container/60 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-md ${k.iconBg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${k.iconColor}`} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-on-surface">{k.name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${k.statusBg} ${k.statusColor}`}>{k.status}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{k.key} · 上次测试：{k.lastTest}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-md text-xs font-medium hover:bg-surface-container-highest transition-colors inline-flex items-center gap-1"><Plug className="w-3 h-3" />测试</button>
                      <button className="bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-md text-xs font-medium hover:bg-surface-container-highest transition-colors inline-flex items-center gap-1"><Check className="w-3 h-3" />设为默认</button>
                      <button className="text-error/70 hover:text-error px-3 py-1.5 rounded-md text-xs font-medium hover:bg-error/5 transition-colors inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />删除</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Config */}
          <div className="bg-surface rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold text-on-surface mb-4">模型配置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">使用 Key</label>
                <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none cursor-pointer">
                  <option>OpenAI GPT-4o（默认）</option><option>Anthropic Claude</option><option>自定义端点</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">默认模型</label>
                <input type="text" defaultValue="gpt-4o-mini" className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">高级模型</label>
                <input type="text" defaultValue="gpt-4o" className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">嵌入模型</label>
                <input type="text" defaultValue="text-embedding-3-small" className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors" />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2"><Plug className="w-3.5 h-3.5" />测试连接</button>
                <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"><Check className="w-3.5 h-3.5" />保存配置</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
