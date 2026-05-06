import { useState, useCallback } from 'react';
import {
  KeyRound, Plus, Trash2, WifiOff,
  RefreshCw, CheckCircle, XCircle, AlertCircle,
  QrCode, Globe, User, Store, ExternalLink,
  Copy, Shield, Zap, ScanLine
} from 'lucide-react';

/* ─── Types ─── */
interface PlatformAccount {
  id: string;
  platform: string;
  displayName: string;
  status: string;
  authType: string;
  createdAt: string;
}

type AccountTab = 'ecommerce' | 'normal';

/* ─── Status helpers ─── */
const STATUS_LABELS: Record<string, string> = {
  CONNECTED: '已连接',
  PENDING_AUTH: '待授权',
  NEEDS_LOGIN: '需要登录',
  EXPIRED: '已过期',
  FAILED: '连接失败',
  DISCONNECTED: '已断开',
  SCANNED: '已扫码',
  WAITING: '等待扫码',
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  CONNECTED: CheckCircle,
  PENDING_AUTH: AlertCircle,
  NEEDS_LOGIN: AlertCircle,
  EXPIRED: XCircle,
  FAILED: XCircle,
  DISCONNECTED: WifiOff,
  SCANNED: CheckCircle,
  WAITING: QrCode,
};

/* ─── E-commerce platform definitions ─── */
const ECOMMERCE_PLATFORMS = [
  { key: 'AMAZON', label: 'Amazon', color: '#FF9900', authMode: 'oauth', desc: '通过 Amazon Seller Central OAuth 授权', region: '全球' },
  { key: 'EBAY', label: 'eBay', color: '#E53238', authMode: 'oauth', desc: '通过 eBay Developer OAuth 授权', region: '全球' },
  { key: 'SHOPIFY', label: 'Shopify', color: '#96BF48', authMode: 'oauth', desc: '通过 Shopify App OAuth 授权', region: '全球' },
  { key: 'TIKTOK_SHOP', label: 'TikTok Shop', color: '#000000', authMode: 'oauth', desc: '通过 TikTok Shop Open API 授权', region: '东南亚/英美' },
  { key: 'MERCADOLIBRE', label: 'MercadoLibre', color: '#FFE600', authMode: 'oauth', desc: '通过 MercadoLibre API 授权', region: '拉美' },
  { key: 'SHOPEE', label: 'Shopee', color: '#EE4D2D', authMode: 'oauth', desc: '通过 Shopee Open Platform 授权', region: '东南亚' },
  { key: 'LAZADA', label: 'Lazada', color: '#0F136D', authMode: 'oauth', desc: '通过 Lazada Open Platform 授权', region: '东南亚' },
  { key: 'ALIEXPRESS', label: 'AliExpress', color: '#FF4747', authMode: 'oauth', desc: '通过速卖通开放平台授权', region: '全球' },
];

/* ─── Normal user platform definitions (MCP-based) ─── */
const NORMAL_PLATFORMS = [
  { key: 'XIAOHONGSHU', label: '小红书', color: '#FE2C55', mcpSource: 'GitHub MCP', desc: '通过小红书 MCP 服务，使用二维码扫码登录', mcpRepo: 'xiaohongshu-mcp' },
  { key: 'DOUYIN', label: '抖音', color: '#000000', mcpSource: 'GitHub MCP', desc: '通过抖音 MCP 服务，使用二维码扫码登录', mcpRepo: 'douyin-mcp' },
  { key: 'WECHAT', label: '微信公众号', color: '#07C160', mcpSource: '官方 API', desc: '通过微信公众平台 API 授权', mcpRepo: '' },
  { key: 'WEIBO', label: '微博', color: '#E6162D', mcpSource: 'GitHub MCP', desc: '通过微博 MCP 服务，使用二维码扫码登录', mcpRepo: 'weibo-mcp' },
  { key: 'BILIBILI', label: 'B站', color: '#00A1D6', mcpSource: 'GitHub MCP', desc: '通过 B站 MCP 服务，使用二维码扫码登录', mcpRepo: 'bilibili-mcp' },
  { key: 'ZHIHU', label: '知乎', color: '#0066FF', mcpSource: 'GitHub MCP', desc: '通过知乎 MCP 服务，使用二维码扫码登录', mcpRepo: 'zhihu-mcp' },
  { key: 'INSTAGRAM', label: 'Instagram', color: '#E4405F', mcpSource: 'GitHub MCP', desc: '通过 Instagram MCP 服务，使用二维码扫码登录', mcpRepo: 'instagram-mcp' },
  { key: 'X_TWITTER', label: 'X / Twitter', color: '#1DA1F2', mcpSource: 'GitHub MCP', desc: '通过 X MCP 服务，使用 OAuth 授权', mcpRepo: 'x-mcp' },
];

/* ─── Mock data for demo ─── */
const MOCK_ECOMMERCE_ACCOUNTS: PlatformAccount[] = [
  { id: '1', platform: 'AMAZON', displayName: 'Amazon US Store', status: 'CONNECTED', authType: 'oauth', createdAt: '2025-01-15' },
  { id: '2', platform: 'SHOPIFY', displayName: 'My Shopify Store', status: 'CONNECTED', authType: 'oauth', createdAt: '2025-02-20' },
  { id: '3', platform: 'TIKTOK_SHOP', displayName: 'TikTok Shop UK', status: 'EXPIRED', authType: 'oauth', createdAt: '2025-03-10' },
];

const MOCK_NORMAL_ACCOUNTS: PlatformAccount[] = [
  { id: '4', platform: 'XIAOHONGSHU', displayName: '小红书品牌号', status: 'CONNECTED', authType: 'mcp_qrcode', createdAt: '2025-03-01' },
  { id: '5', platform: 'DOUYIN', displayName: '抖音企业号', status: 'NEEDS_LOGIN', authType: 'mcp_qrcode', createdAt: '2025-03-05' },
];

export function SettingsAccountsPage() {
  const [tab, setTab] = useState<AccountTab>('ecommerce');
  const [ecommerceAccounts] = useState<PlatformAccount[]>(MOCK_ECOMMERCE_ACCOUNTS);
  const [normalAccounts] = useState<PlatformAccount[]>(MOCK_NORMAL_ACCOUNTS);
  const [showAddEcommerce, setShowAddEcommerce] = useState(false);
  const [showQrCode, setShowQrCode] = useState<string | null>(null);
  const [qrStatus, setQrStatus] = useState<'waiting' | 'scanned' | 'confirmed' | 'expired'>('waiting');
  const [toast, setToast] = useState<string | null>(null);
  const [mcpConfig, setMcpConfig] = useState<Record<string, { installed: boolean; version: string }>>({
    XIAOHONGSHU: { installed: true, version: '1.2.0' },
    DOUYIN: { installed: false, version: '' },
    WEIBO: { installed: true, version: '0.8.3' },
    BILIBILI: { installed: false, version: '' },
    INSTAGRAM: { installed: true, version: '1.0.1' },
    X_TWITTER: { installed: true, version: '0.9.5' },
    ZHIHU: { installed: false, version: '' },
    WECHAT: { installed: true, version: '2.1.0' },
  });

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleConnectEcommerce = (platformKey: string) => {
    setShowAddEcommerce(false);
    showToast(`正在跳转至 ${ECOMMERCE_PLATFORMS.find(p => p.key === platformKey)?.label} OAuth 授权页面...`);
  };

  const handleShowQrCode = (platformKey: string) => {
    setShowQrCode(platformKey);
    setQrStatus('waiting');
    // Simulate QR code scanning flow
    setTimeout(() => setQrStatus('scanned'), 3000);
    setTimeout(() => setQrStatus('confirmed'), 5000);
    setTimeout(() => {
      setQrStatus('waiting');
      setShowQrCode(null);
      showToast(`${NORMAL_PLATFORMS.find(p => p.key === platformKey)?.label} 账号连接成功！`);
    }, 6000);
  };

  const handleInstallMcp = (platformKey: string) => {
    setMcpConfig(prev => ({ ...prev, [platformKey]: { installed: true, version: '1.0.0' } }));
    showToast(`MCP 服务安装成功: ${NORMAL_PLATFORMS.find(p => p.key === platformKey)?.mcpRepo}`);
  };

  const handleDeleteAccount = (accountId: string, accountName: string) => {
    showToast(`已断开账号: ${accountName}`);
  };

  const handleReconnect = (accountName: string) => {
    showToast(`正在重新连接: ${accountName}...`);
  };

  const handleCopyMcpCommand = (repo: string) => {
    const command = `npx @anthropic/mcp install ${repo}`;
    navigator.clipboard.writeText(command).catch(() => {});
    showToast('安装命令已复制到剪贴板');
  };

  /* ─── Render: E-commerce Tab ─── */
  const renderEcommerceTab = () => (
    <>
      {/* Connected E-commerce Accounts */}
      <div className="settings-card">
        <div className="card-header">
          <h2 className="flex items-center gap-2"><Store size={18} /> 已连接的电商平台</h2>
          <button className="btn-secondary" onClick={() => setShowAddEcommerce(!showAddEcommerce)}>
            <Plus size={14} /> 添加平台
          </button>
        </div>

        {ecommerceAccounts.length === 0 ? (
          <div className="acq-empty">
            <Store size={32} />
            <p>暂无已连接的电商平台</p>
            <p className="page-desc">点击"添加平台"开始连接您的电商店铺</p>
          </div>
        ) : (
          <div className="accounts-grid">
            {ecommerceAccounts.map(account => {
              const StatusIcon = STATUS_ICONS[account.status] ?? AlertCircle;
              const platformDef = ECOMMERCE_PLATFORMS.find(p => p.key === account.platform);
              return (
                <div key={account.id} className="account-card">
                  <div className="account-platform" style={{ background: platformDef?.color ?? '#6B7280' }}>
                    <span className="platform-letter">{(platformDef?.label ?? account.platform).charAt(0)}</span>
                  </div>
                  <div className="account-info">
                    <strong>{account.displayName}</strong>
                    <span className="account-platform-label">{platformDef?.label ?? account.platform}</span>
                    <span className="text-xs text-on-surface-variant/60 flex items-center gap-1 mt-0.5">
                      <Shield size={10} /> OAuth 授权 · {platformDef?.region}
                    </span>
                  </div>
                  <div className="account-status">
                    <StatusIcon size={14} style={{ color: account.status === 'CONNECTED' ? '#16A37B' : '#F59E0B' }} />
                    <span>{STATUS_LABELS[account.status] ?? account.status}</span>
                  </div>
                  <div className="account-actions flex items-center gap-1">
                    {account.status !== 'CONNECTED' && (
                      <button className="btn-icon" title="重新连接" onClick={() => handleReconnect(account.displayName)}>
                        <RefreshCw size={14} />
                      </button>
                    )}
                    <button className="btn-icon" title="断开" onClick={() => handleDeleteAccount(account.id, account.displayName)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add E-commerce Platform Panel */}
      {showAddEcommerce && (
        <div className="settings-card">
          <div className="card-header">
            <h2 className="flex items-center gap-2"><Globe size={18} /> 选择电商平台连接</h2>
            <button className="btn-ghost" onClick={() => setShowAddEcommerce(false)}>关闭</button>
          </div>
          <p className="text-sm text-on-surface-variant mb-4">
            选择您要连接的电商平台，通过官方 OAuth 授权安全连接您的店铺数据。
            <span className="inline-flex items-center gap-1 ml-1 text-primary"><Shield size={12} /> 数据加密传输</span>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {ECOMMERCE_PLATFORMS.map(platform => {
              const isAlreadyConnected = ecommerceAccounts.some(a => a.platform === platform.key && a.status === 'CONNECTED');
              return (
                <div
                  key={platform.key}
                  className={`relative rounded-xl border border-outline-variant/20 p-4 transition-all hover:shadow-md ${
                    isAlreadyConnected ? 'opacity-50' : 'cursor-pointer hover:border-primary/40 hover:bg-primary/5'
                  }`}
                  onClick={() => !isAlreadyConnected && handleConnectEcommerce(platform.key)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: platform.color }}>
                      {platform.label.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">{platform.label}</p>
                      <p className="text-xs text-on-surface-variant">{platform.region}</p>
                    </div>
                  </div>
                  <p className="text-xs text-on-surface-variant/70 leading-relaxed">{platform.desc}</p>
                  {isAlreadyConnected && (
                    <span className="absolute top-2 right-2 text-xs text-success flex items-center gap-0.5"><CheckCircle size={10} />已连接</span>
                  )}
                  {!isAlreadyConnected && (
                    <span className="absolute top-2 right-2 text-xs text-primary flex items-center gap-0.5"><ExternalLink size={10} />连接</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* E-commerce Info Box */}
      <div className="settings-card bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3 p-1">
          <Zap size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-on-surface">电商平台 API 接入说明</h3>
            <p className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
              电商平台（Amazon、Shopify、eBay 等）提供官方开放平台 API，支持 OAuth 安全授权。
              连接后可自动同步订单、商品、库存等数据，实现智能化运营。
              授权 Token 加密存储，定期自动刷新。
            </p>
          </div>
        </div>
      </div>
    </>
  );

  /* ─── Render: Normal User Tab ─── */
  const renderNormalTab = () => (
    <>
      {/* Connected Normal User Accounts */}
      <div className="settings-card">
        <div className="card-header">
          <h2 className="flex items-center gap-2"><User size={18} /> 已连接的社交平台</h2>
        </div>

        {normalAccounts.length === 0 ? (
          <div className="acq-empty">
            <User size={32} />
            <p>暂无已连接的社交平台</p>
            <p className="page-desc">选择下方平台，通过 MCP 服务 + 二维码扫码登录</p>
          </div>
        ) : (
          <div className="accounts-grid">
            {normalAccounts.map(account => {
              const StatusIcon = STATUS_ICONS[account.status] ?? AlertCircle;
              const platformDef = NORMAL_PLATFORMS.find(p => p.key === account.platform);
              return (
                <div key={account.id} className="account-card">
                  <div className="account-platform" style={{ background: platformDef?.color ?? '#6B7280' }}>
                    <span className="platform-letter">{(platformDef?.label ?? account.platform).charAt(0)}</span>
                  </div>
                  <div className="account-info">
                    <strong>{account.displayName}</strong>
                    <span className="account-platform-label">{platformDef?.label ?? account.platform}</span>
                    <span className="text-xs text-on-surface-variant/60 flex items-center gap-1 mt-0.5">
                      <ScanLine size={10} /> MCP 扫码登录
                    </span>
                  </div>
                  <div className="account-status">
                    <StatusIcon size={14} style={{ color: account.status === 'CONNECTED' ? '#16A37B' : '#F59E0B' }} />
                    <span>{STATUS_LABELS[account.status] ?? account.status}</span>
                  </div>
                  <div className="account-actions flex items-center gap-1">
                    {account.status !== 'CONNECTED' && (
                      <button className="btn-secondary text-xs" onClick={() => handleShowQrCode(account.platform)}>
                        <QrCode size={12} /> 重新扫码
                      </button>
                    )}
                    <button className="btn-icon" title="断开" onClick={() => handleDeleteAccount(account.id, account.displayName)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MCP Service Status */}
      <div className="settings-card">
        <div className="card-header">
          <h2 className="flex items-center gap-2"><Zap size={18} /> MCP 服务状态与连接</h2>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          普通用户无法直接获取平台 API 权限，需通过 GitHub 开源的 MCP (Model Context Protocol) 服务实现连接。
          扫码登录后，AI 可自动操作您的社交账号。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {NORMAL_PLATFORMS.map(platform => {
            const mcp = mcpConfig[platform.key];
            const isQrShowing = showQrCode === platform.key;
            return (
              <div key={platform.key} className="rounded-xl border border-outline-variant/20 p-4 transition-all hover:shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: platform.color }}>
                    {platform.label.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-on-surface">{platform.label}</p>
                      {mcp?.installed ? (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-success/10 text-success">MCP v{mcp.version}</span>
                      ) : (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning">未安装</span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant/70 truncate">{platform.desc}</p>
                  </div>
                </div>

                {/* MCP source info */}
                {platform.mcpSource === 'GitHub MCP' && (
                  <div className="mb-3 p-2 rounded-lg bg-surface-container/50 text-xs">
                    <div className="flex items-center gap-1 text-on-surface-variant mb-1">
                      <Globe size={10} /> MCP 来源: GitHub 开源
                    </div>
                    <code className="text-on-surface-variant/60 block truncate">{platform.mcpRepo}</code>
                    <button
                      className="mt-1.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      onClick={() => handleCopyMcpCommand(platform.mcpRepo)}
                    >
                      <Copy size={10} /> 复制安装命令
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {!mcp?.installed && (
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => handleInstallMcp(platform.key)}
                    >
                      <Zap size={12} /> 安装 MCP
                    </button>
                  )}
                  {mcp?.installed && !isQrShowing && (
                    <button
                      className="btn-primary text-xs"
                      onClick={() => handleShowQrCode(platform.key)}
                    >
                      <QrCode size={12} /> 扫码登录
                    </button>
                  )}
                  {mcp?.installed && isQrShowing && (
                    <button
                      className="btn-ghost text-xs"
                      onClick={() => { setShowQrCode(null); setQrStatus('waiting'); }}
                    >
                      取消
                    </button>
                  )}
                </div>

                {/* QR Code Display */}
                {isQrShowing && (
                  <div className="mt-4 p-4 rounded-xl bg-surface-container text-center">
                    <div className="w-40 h-40 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-outline-variant/40">
                      {qrStatus === 'waiting' ? (
                        <div className="text-center">
                          <QrCode size={64} className="mx-auto text-on-surface-variant/30" />
                          <p className="text-xs text-on-surface-variant/60 mt-2">加载二维码中...</p>
                        </div>
                      ) : qrStatus === 'scanned' ? (
                        <div className="text-center">
                          <CheckCircle size={48} className="mx-auto text-warning" />
                          <p className="text-xs text-warning mt-2">已扫码，请在手机上确认</p>
                        </div>
                      ) : qrStatus === 'confirmed' ? (
                        <div className="text-center">
                          <CheckCircle size={48} className="mx-auto text-success" />
                          <p className="text-xs text-success mt-2">登录成功！</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <XCircle size={48} className="mx-auto text-error" />
                          <p className="text-xs text-error mt-2">二维码已过期，请重新扫码</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      请使用 <strong>{platform.label}</strong> App 扫描二维码登录
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MCP Info Box */}
      <div className="settings-card bg-warning/5 border-warning/20">
        <div className="flex items-start gap-3 p-1">
          <AlertCircle size={18} className="text-warning shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-on-surface">普通用户 MCP 接入说明</h3>
            <p className="text-xs text-on-surface-variant/80 mt-1 leading-relaxed">
              小红书、抖音等平台不提供开放 API 给普通用户。通过 GitHub 开源 MCP (Model Context Protocol) 服务，
              可以实现模拟登录和自动化操作。MCP 服务在本地运行，通过二维码扫码获取登录凭证，
              所有操作均在您的浏览器中执行，不存储账号密码。
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
                <ScanLine size={10} /> 二维码扫码登录
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
                <Shield size={10} /> 本地运行不存储密码
              </span>
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-surface-container text-on-surface-variant">
                <Zap size={10} /> AI 自动化操作
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="page-container">
      <h1 className="page-title"><KeyRound size={22} /> 账号配置</h1>
      <p className="page-desc">管理电商平台与社交平台的账号连接</p>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 mb-6 bg-surface-container rounded-lg w-fit">
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'ecommerce'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          onClick={() => setTab('ecommerce')}
        >
          <Store size={16} /> 电商平台账户
        </button>
        <button
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'normal'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-high'
          }`}
          onClick={() => setTab('normal')}
        >
          <User size={16} /> 普通用户账号
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'ecommerce' ? renderEcommerceTab() : renderNormalTab()}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg bg-on-surface text-on-primary shadow-lg animate-[fadeInUp_0.3s_ease]">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
