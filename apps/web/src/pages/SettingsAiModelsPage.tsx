import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import {
  Brain, Plus, Trash2, Check, X, Key, Settings2,
  Zap, AlertTriangle, Star, Eye, EyeOff
} from 'lucide-react';

interface AiKey {
  id: string;
  provider: string;
  name: string;
  apiKeyPreview: string;
  baseUrl?: string;
  status: string;
  isDefault: boolean;
  lastTestedAt?: string;
  createdAt: string;
}

interface AiConfig {
  id: string;
  provider: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  purpose: string;
}

const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
  DEEPSEEK: 'DeepSeek',
  ZHIPU: '智谱 AI',
  DOUBAO: '豆包',
  MOONSHOT: 'Moonshot',
  CUSTOM: '自定义',
};

const PROVIDER_COLORS: Record<string, string> = {
  OPENAI: '#10A37F',
  ANTHROPIC: '#D4A574',
  DEEPSEEK: '#4D6BFE',
  ZHIPU: '#3366FF',
  DOUBAO: '#FF6A00',
  MOONSHOT: '#6C5CE7',
  CUSTOM: '#6B7280',
};

const PURPOSE_LABELS: Record<string, string> = {
  GENERAL: '通用对话',
  COPYWRITING: '文案生成',
  ANALYSIS: '数据分析',
  TRANSLATION: '翻译',
  MODERATION: '内容审核',
  EMBEDDING: '向量化',
};

export function SettingsAiModelsPage() {
  const [keys, setKeys] = useState<AiKey[]>([]);
  const [configs, setConfigs] = useState<AiConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKey, setShowAddKey] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  // New key form
  const [newKey, setNewKey] = useState({
    provider: 'OPENAI',
    name: '',
    apiKey: '',
    baseUrl: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysRes, configsRes] = await Promise.allSettled([
        apiClient.get('/ai-keys'),
        apiClient.get('/ai-configs'),
      ]);
      if (keysRes.status === 'fulfilled') setKeys(keysRes.value.data?.data ?? keysRes.value.data ?? []);
      if (configsRes.status === 'fulfilled') setConfigs(configsRes.value.data?.data ?? configsRes.value.data ?? []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAddKey = async () => {
    try {
      await apiClient.post('/ai-keys', newKey);
      setShowAddKey(false);
      setNewKey({ provider: 'OPENAI', name: '', apiKey: '', baseUrl: '' });
      fetchData();
    } catch { /* handle error */ }
  };

  const handleDeleteKey = async (id: string) => {
    try {
      await apiClient.delete(`/ai-keys/${id}`);
      fetchData();
    } catch { /* handle error */ }
  };

  const handleTestKey = async (id: string) => {
    setTesting(id);
    try {
      await apiClient.post(`/ai-keys/${id}/test`);
      fetchData();
    } catch { /* handle error */ }
    finally {
      setTesting(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await apiClient.patch(`/ai-keys/${id}/default`);
      fetchData();
    } catch { /* handle error */ }
  };

  return (
    <div className="page-container">
      <h1 className="page-title"><Brain size={22} /> AI 模型设置</h1>
      <p className="page-desc">管理 AI 服务的 API Key 和模型配置</p>

      {/* API Keys Section */}
      <div className="settings-card">
        <div className="card-header">
          <h2><Key size={18} /> API Key 管理</h2>
          <button className="btn-primary" onClick={() => setShowAddKey(true)}>
            <Plus size={14} /> 添加 Key
          </button>
        </div>

        {loading ? (
          <div className="acq-loading">加载中...</div>
        ) : keys.length === 0 ? (
          <div className="acq-empty">
            <Key size={32} />
            <p>暂无 API Key，请添加以启用 AI 功能</p>
          </div>
        ) : (
          <div className="keys-list">
            {keys.map(k => {
              const isActive = k.status === 'ACTIVE';
              return (
                <div key={k.id} className={`key-card ${k.isDefault ? 'key-default' : ''}`}>
                  <div className="key-provider" style={{ background: PROVIDER_COLORS[k.provider] ?? '#6B7280' }}>
                    <span>{(PROVIDER_LABELS[k.provider] ?? k.provider).charAt(0)}</span>
                  </div>
                  <div className="key-info">
                    <div className="key-name-row">
                      <strong>{k.name || PROVIDER_LABELS[k.provider]}</strong>
                      {k.isDefault && <span className="default-badge"><Star size={10} /> 默认</span>}
                    </div>
                    <div className="key-detail-row">
                      <span className="key-provider-label">{PROVIDER_LABELS[k.provider]}</span>
                      <span className="key-preview">
                        {showKey === k.id ? k.apiKeyPreview : `${k.apiKeyPreview.slice(0, 8)}...`}
                        <button className="btn-icon-xs" onClick={() => setShowKey(showKey === k.id ? null : k.id)}>
                          {showKey === k.id ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </span>
                    </div>
                    {k.baseUrl && <div className="key-detail-row"><span className="key-base-url">Base: {k.baseUrl}</span></div>}
                  </div>
                  <div className="key-status">
                    <span className={`status-dot ${isActive ? 'active' : 'inactive'}`} />
                    <span>{isActive ? '可用' : '不可用'}</span>
                  </div>
                  <div className="key-actions">
                    <button className="btn-icon" title="测试连接" onClick={() => handleTestKey(k.id)} disabled={testing === k.id}>
                      <Zap size={14} />
                    </button>
                    {!k.isDefault && (
                      <button className="btn-icon" title="设为默认" onClick={() => handleSetDefault(k.id)}>
                        <Star size={14} />
                      </button>
                    )}
                    <button className="btn-icon danger" title="删除" onClick={() => handleDeleteKey(k.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Model Configs Section */}
      <div className="settings-card">
        <div className="card-header">
          <h2><Settings2 size={18} /> 模型配置</h2>
        </div>
        {configs.length === 0 ? (
          <div className="acq-empty">
            <Settings2 size={32} />
            <p>暂无模型配置，添加 API Key 后可配置模型参数</p>
          </div>
        ) : (
          <div className="configs-grid">
            {configs.map(c => (
              <div key={c.id} className="config-card">
                <div className="config-header">
                  <span className="config-provider" style={{ background: PROVIDER_COLORS[c.provider] ?? '#6B7280' }}>
                    {PROVIDER_LABELS[c.provider]}
                  </span>
                  <span className="config-purpose">{PURPOSE_LABELS[c.purpose] ?? c.purpose}</span>
                </div>
                <div className="config-body">
                  <div className="config-row">
                    <span>模型</span><strong>{c.modelName}</strong>
                  </div>
                  <div className="config-row">
                    <span>Temperature</span><strong>{c.temperature}</strong>
                  </div>
                  <div className="config-row">
                    <span>Max Tokens</span><strong>{c.maxTokens}</strong>
                  </div>
                  <div className="config-row">
                    <span>Top P</span><strong>{c.topP}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Key Modal */}
      {showAddKey && (
        <div className="modal-overlay" onClick={() => setShowAddKey(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2>添加 API Key</h2>
            <div className="form-group">
              <label className="form-label">服务商</label>
              <select className="form-input" value={newKey.provider} onChange={e => setNewKey({ ...newKey, provider: e.target.value })}>
                <option value="OPENAI">OpenAI</option>
                <option value="ANTHROPIC">Anthropic</option>
                <option value="DEEPSEEK">DeepSeek</option>
                <option value="ZHIPU">智谱 AI</option>
                <option value="DOUBAO">豆包</option>
                <option value="MOONSHOT">Moonshot</option>
                <option value="CUSTOM">自定义</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">名称</label>
              <input className="form-input" value={newKey.name} onChange={e => setNewKey({ ...newKey, name: e.target.value })} placeholder="如：OpenAI 生产环境 Key" />
            </div>
            <div className="form-group">
              <label className="form-label">API Key</label>
              <input className="form-input" type="password" value={newKey.apiKey} onChange={e => setNewKey({ ...newKey, apiKey: e.target.value })} placeholder="sk-..." />
            </div>
            <div className="form-group">
              <label className="form-label">自定义 Base URL (可选)</label>
              <input className="form-input" value={newKey.baseUrl} onChange={e => setNewKey({ ...newKey, baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" />
            </div>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setShowAddKey(false)}>取消</button>
              <button className="btn-primary" onClick={handleAddKey} disabled={!newKey.apiKey}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
