import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import {
  KeyRound, Plus, Trash2, Wifi, WifiOff, Monitor,
  RefreshCw, ExternalLink, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';

interface PlatformAccount {
  id: string;
  platform: string;
  displayName: string;
  status: string;
  authType: string;
  createdAt: string;
}

interface CdpSession {
  status: string;
  debugPort: number;
  chromeVersion?: string;
  connectedAt?: string;
}

const STATUS_LABELS: Record<string, string> = {
  CONNECTED: '已连接',
  PENDING_AUTH: '待授权',
  NEEDS_LOGIN: '需要登录',
  EXPIRED: '已过期',
  FAILED: '连接失败',
  DISCONNECTED: '已断开',
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  CONNECTED: CheckCircle,
  PENDING_AUTH: AlertCircle,
  NEEDS_LOGIN: AlertCircle,
  EXPIRED: XCircle,
  FAILED: XCircle,
  DISCONNECTED: WifiOff,
};

const PLATFORM_LABELS: Record<string, string> = {
  AMAZON: 'Amazon',
  EBAY: 'eBay',
  SHOPIFY: 'Shopify',
  TIKTOK_SHOP: 'TikTok Shop',
  XIAOHONGSHU: '小红书',
  DOUYIN: '抖音',
  TIKTOK: 'TikTok',
  INSTAGRAM: 'Instagram',
  X_TWITTER: 'X/Twitter',
  MERCADOLIBRE: 'MercadoLibre',
};

const PLATFORM_COLORS: Record<string, string> = {
  AMAZON: '#FF9900',
  EBAY: '#E53238',
  SHOPIFY: '#96BF48',
  TIKTOK_SHOP: '#000000',
  XIAOHONGSHU: '#FE2C55',
  DOUYIN: '#000000',
  TIKTOK: '#000000',
  INSTAGRAM: '#E4405F',
  X_TWITTER: '#1DA1F2',
  MERCADOLIBRE: '#FFE600',
};

export function SettingsAccountsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [cdpSession, setCdpSession] = useState<CdpSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [cdpHost, setCdpHost] = useState('localhost');
  const [cdpPort, setCdpPort] = useState(9222);
  const [showConnect, setShowConnect] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [accRes, cdpRes] = await Promise.allSettled([
        apiClient.get('/platform-accounts'),
        apiClient.get('/cdp/status'),
      ]);
      if (accRes.status === 'fulfilled') setAccounts(accRes.value.data?.data ?? accRes.value.data ?? []);
      if (cdpRes.status === 'fulfilled') setCdpSession(cdpRes.value.data?.data ?? cdpRes.value.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConnectCdp = async () => {
    setConnecting(true);
    try {
      const res = await apiClient.post('/cdp/connect', { host: cdpHost, port: cdpPort });
      setCdpSession(res.data?.data ?? res.data);
      setShowConnect(false);
      fetchData();
    } catch {
      // handle error
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectCdp = async () => {
    try {
      await apiClient.delete('/cdp/connect');
      setCdpSession(null);
      fetchData();
    } catch { /* handle error */ }
  };

  const handleScanLogins = async () => {
    try {
      await apiClient.get('/cdp/scan-logins');
      fetchData();
    } catch { /* handle error */ }
  };

  const isCdpConnected = cdpSession?.status === 'CONNECTED';

  return (
    <div className="page-container">
      <h1 className="page-title"><KeyRound size={22} /> 平台账号管理</h1>
      <p className="page-desc">管理跨境电商平台账号连接，通过 CDP 浏览器实现自动化操作</p>

      {/* CDP Browser Connection */}
      <div className="settings-card">
        <div className="card-header">
          <h2><Monitor size={18} /> CDP 浏览器连接</h2>
          {isCdpConnected ? (
            <span className="connection-badge connected"><Wifi size={14} /> 已连接</span>
          ) : (
            <span className="connection-badge disconnected"><WifiOff size={14} /> 未连接</span>
          )}
        </div>
        {isCdpConnected ? (
          <div className="cdp-info">
            <div className="cdp-detail">
              <span>Chrome 版本</span>
              <strong>{cdpSession?.chromeVersion ?? 'Unknown'}</strong>
            </div>
            <div className="cdp-detail">
              <span>调试端口</span>
              <strong>{cdpSession?.debugPort ?? 9222}</strong>
            </div>
            <div className="cdp-detail">
              <span>连接时间</span>
              <strong>{cdpSession?.connectedAt ? new Date(cdpSession.connectedAt).toLocaleString() : '-'}</strong>
            </div>
            <div className="cdp-actions">
              <button className="btn-secondary" onClick={handleScanLogins}>
                <RefreshCw size={14} /> 扫描平台登录
              </button>
              <button className="btn-ghost" onClick={handleDisconnectCdp}>
                <WifiOff size={14} /> 断开连接
              </button>
            </div>
          </div>
        ) : (
          <div className="cdp-connect-section">
            <p>连接 Chrome 浏览器以实现平台自动化操作。请先以调试模式启动 Chrome：</p>
            <div className="code-block">
              <code>google-chrome --remote-debugging-port=9222</code>
            </div>
            {!showConnect ? (
              <button className="btn-primary" onClick={() => setShowConnect(true)}>
                <Wifi size={14} /> 连接浏览器
              </button>
            ) : (
              <div className="connect-form">
                <div className="form-row">
                  <input className="form-input" value={cdpHost} onChange={e => setCdpHost(e.target.value)} placeholder="Host" style={{ flex: 1 }} />
                  <input className="form-input" type="number" value={cdpPort} onChange={e => setCdpPort(Number(e.target.value))} placeholder="Port" style={{ width: 100 }} />
                </div>
                <div className="form-row">
                  <button className="btn-primary" onClick={handleConnectCdp} disabled={connecting}>
                    {connecting ? '连接中...' : '连接'}
                  </button>
                  <button className="btn-ghost" onClick={() => setShowConnect(false)}>取消</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Platform Accounts */}
      <div className="settings-card">
        <div className="card-header">
          <h2>已连接平台</h2>
          <button className="btn-secondary"><Plus size={14} /> 添加平台</button>
        </div>
        {loading ? (
          <div className="acq-loading">加载中...</div>
        ) : accounts.length === 0 ? (
          <div className="acq-empty">
            <KeyRound size={32} />
            <p>暂无已连接的平台账号</p>
            <p className="page-desc">连接 Chrome 浏览器后，可通过"扫描平台登录"自动检测</p>
          </div>
        ) : (
          <div className="accounts-grid">
            {accounts.map(account => {
              const StatusIcon = STATUS_ICONS[account.status] ?? AlertCircle;
              return (
                <div key={account.id} className="account-card">
                  <div className="account-platform" style={{ background: PLATFORM_COLORS[account.platform] ?? '#6B7280' }}>
                    <span className="platform-letter">{(PLATFORM_LABELS[account.platform] ?? account.platform).charAt(0)}</span>
                  </div>
                  <div className="account-info">
                    <strong>{account.displayName}</strong>
                    <span className="account-platform-label">{PLATFORM_LABELS[account.platform] ?? account.platform}</span>
                  </div>
                  <div className="account-status">
                    <StatusIcon size={14} style={{ color: account.status === 'CONNECTED' ? '#16A37B' : '#F59E0B' }} />
                    <span>{STATUS_LABELS[account.status] ?? account.status}</span>
                  </div>
                  <div className="account-actions">
                    <button className="btn-icon" title="删除"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
