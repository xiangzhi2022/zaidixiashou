import { Info, Cloud, KeyRound, Plus, Brain, Sparkles, Globe, Check, Trash2, Plug, ExternalLink, Zap, Shield } from 'lucide-react';
import { useState } from 'react';

// ─── AI Provider Config (Official Docs) ───────────────────
interface AIProvider {
  id: string;
  name: string;
  docUrl: string;
  docSource: string;
  icon: typeof Brain;
  iconBg: string;
  iconColor: string;
  models: { id: string; name: string; type: 'chat' | 'embedding' | 'vision' }[];
  defaultBaseUrl: string;
}

const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    docUrl: 'https://platform.openai.com/docs/models',
    docSource: 'OpenAI 官方模型文档',
    icon: Brain,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    defaultBaseUrl: 'https://api.openai.com/v1',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', type: 'chat' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', type: 'chat' },
      { id: 'gpt-4.1', name: 'GPT-4.1', type: 'chat' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', type: 'chat' },
      { id: 'o3', name: 'o3', type: 'chat' },
      { id: 'o4-mini', name: 'o4-mini', type: 'chat' },
      { id: 'text-embedding-3-small', name: 'Embedding V3 Small', type: 'embedding' },
      { id: 'text-embedding-3-large', name: 'Embedding V3 Large', type: 'embedding' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    docUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
    docSource: 'Anthropic 模型文档',
    icon: Sparkles,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', type: 'chat' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', type: 'chat' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', type: 'chat' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    docUrl: 'https://platform.deepseek.com/api-docs/',
    docSource: 'DeepSeek API 文档',
    icon: Zap,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek Chat', type: 'chat' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', type: 'chat' },
    ],
  },
  {
    id: 'custom',
    name: '自定义端点',
    docUrl: '',
    docSource: '',
    icon: Globe,
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    defaultBaseUrl: '',
    models: [],
  },
];

const savedKeys = [
  { id: 'key-1', name: '主力 GPT-4o', provider: 'openai', key: 'sk-***...***3xKz', lastTest: '2 分钟前', status: '默认' as const, latency: 320 },
  { id: 'key-2', name: 'Claude 备用', provider: 'anthropic', key: 'sk-ant-***...***7mNx', lastTest: '1 小时前', status: '已测试' as const, latency: 450 },
  { id: 'key-3', name: 'DeepSeek 性价比', provider: 'deepseek', key: 'sk-***...***9pQr', lastTest: '尚未测试', status: '待测试' as const, latency: null },
];

export function SettingsAIModelsPage() {
  const [apiSource, setApiSource] = useState<'platform' | 'ownkey'>('platform');
  const [showAddKey, setShowAddKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case '默认': return { bg: 'bg-success/15', color: 'text-success' };
      case '已测试': return { bg: 'bg-primary/15', color: 'text-primary' };
      case '待测试': return { bg: 'bg-surface-container-high', color: 'text-on-surface-variant' };
      default: return { bg: 'bg-error/15', color: 'text-error' };
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-on-surface">AI 模型设置</h1>
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
              <span className="text-xs text-on-surface-variant">当前套餐：专业版 (PRO)</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-on-surface">今日已用 <span className="font-semibold text-on-surface">42</span> 次 / 500 次</span>
              <span className="text-sm font-semibold text-success">8.4%</span>
            </div>
            <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: '8.4%' }} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-on-surface-variant">剩余 458 次 · 每日额度将于 00:00 重置</span>
              <a href="#/settings/billing" className="text-xs text-primary font-medium hover:underline">升级套餐</a>
            </div>
          </div>

          {/* Supported Models */}
          <div className="bg-surface rounded-lg shadow-card p-5">
            <h3 className="text-base font-semibold text-on-surface mb-4">平台支持的模型</h3>
            <div className="space-y-3">
              {AI_PROVIDERS.filter(p => p.id !== 'custom').map(provider => {
                const Icon = provider.icon;
                return (
                  <div key={provider.id} className="bg-surface-container/60 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md ${provider.iconBg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${provider.iconColor}`} /></div>
                        <div>
                          <p className="text-sm font-semibold text-on-surface">{provider.name}</p>
                          <p className="text-xs text-on-surface-variant">Base URL: {provider.defaultBaseUrl}</p>
                        </div>
                      </div>
                      {provider.docUrl && (
                        <a href={provider.docUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline">
                          <ExternalLink className="w-3 h-3" />{provider.docSource}
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {provider.models.map(model => (
                        <span key={model.id} className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs ${model.type === 'chat' ? 'bg-primary/10 text-primary' : model.type === 'embedding' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {model.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Own Key Panel */}
      {apiSource === 'ownkey' && (
        <div>
          {/* Saved Keys */}
          <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-on-surface">已保存的 Key</h3>
              <button onClick={() => setShowAddKey(true)} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />添加 Key
              </button>
            </div>
            <div className="space-y-3">
              {savedKeys.map((k) => {
                const provider = AI_PROVIDERS.find(p => p.id === k.provider);
                const Icon = provider?.icon || Globe;
                const iconBg = provider?.iconBg || 'bg-surface-container';
                const iconColor = provider?.iconColor || 'text-on-surface-variant';
                const statusStyle = getStatusStyle(k.status);
                return (
                  <div key={k.id} className="bg-surface-container/60 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-md ${iconBg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-on-surface">{k.name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium ${statusStyle.bg} ${statusStyle.color}`}>{k.status}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">{k.key} · 上次测试: {k.lastTest}{k.latency ? ` · 延迟: ${k.latency}ms` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-md text-xs font-medium hover:bg-surface-container-highest transition-colors inline-flex items-center gap-1"><Plug className="w-3 h-3" />测试</button>
                      {k.status !== '默认' && <button className="bg-surface-container-high text-on-surface-variant px-3 py-1.5 rounded-md text-xs font-medium hover:bg-surface-container-highest transition-colors inline-flex items-center gap-1"><Check className="w-3 h-3" />设为默认</button>}
                      <button className="text-error/70 hover:text-error px-3 py-1.5 rounded-md text-xs font-medium hover:bg-error/5 transition-colors inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />删除</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Config */}
          <div className="bg-surface rounded-lg shadow-card p-5 mb-6">
            <h3 className="text-base font-semibold text-on-surface mb-4">模型配置</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">使用 Key</label>
                <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none cursor-pointer">
                  {savedKeys.map(k => <option key={k.id}>{k.name}（{k.status}）</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">默认对话模型</label>
                <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none cursor-pointer">
                  {AI_PROVIDERS.filter(p => p.id !== 'custom').flatMap(p => p.models.filter(m => m.type === 'chat').map(m => <option key={m.id} value={m.id}>{p.name} - {m.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">高级推理模型</label>
                <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none cursor-pointer">
                  <option value="o3">OpenAI - o3</option>
                  <option value="o4-mini">OpenAI - o4-mini</option>
                  <option value="deepseek-reasoner">DeepSeek - Reasoner</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1.5">嵌入模型</label>
                <select className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors appearance-none cursor-pointer">
                  {AI_PROVIDERS.filter(p => p.id !== 'custom').flatMap(p => p.models.filter(m => m.type === 'embedding').map(m => <option key={m.id} value={m.id}>{p.name} - {m.name}</option>))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2"><Plug className="w-3.5 h-3.5" />测试连接</button>
                <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"><Check className="w-3.5 h-3.5" />保存配置</button>
              </div>
            </div>
          </div>

          {/* Add Key Modal */}
          {showAddKey && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-surface rounded-xl shadow-dialog w-full max-w-lg mx-4 p-6">
                <h3 className="text-lg font-semibold text-on-surface mb-4">添加 API Key</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">提供商</label>
                    <select value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)} className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30">
                      {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">名称</label>
                    <input type="text" placeholder="例如: 生产环境 GPT-4o" className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-on-surface mb-1.5">API Key</label>
                    <input type="password" placeholder={selectedProvider === 'openai' ? 'sk-...' : selectedProvider === 'anthropic' ? 'sk-ant-...' : '输入你的 API Key'} className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  {selectedProvider === 'custom' && (
                    <div>
                      <label className="block text-sm font-medium text-on-surface mb-1.5">Base URL</label>
                      <input type="url" placeholder="https://api.example.com/v1" className="w-full bg-surface-container border-none rounded-md px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  )}
                  {AI_PROVIDERS.find(p => p.id === selectedProvider)?.docUrl && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-on-surface-variant" />
                      <a href={AI_PROVIDERS.find(p => p.id === selectedProvider)?.docUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />查看 {AI_PROVIDERS.find(p => p.id === selectedProvider)?.docSource}
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setShowAddKey(false)} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high">取消</button>
                  <button onClick={() => setShowAddKey(false)} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">保存</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
