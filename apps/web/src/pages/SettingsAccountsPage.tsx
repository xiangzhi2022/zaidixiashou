import { useState } from 'react';
import {
  Wifi, Unplug, Camera, LifeBuoy, Globe, BookOpen, Music, Music2,
  SearchCheck, LogIn, CheckCircle, AlertCircle, Info, AlertTriangle,
  ExternalLink, ChevronRight, Settings, Shield, ShoppingBag, Store,
  Plug, RefreshCw, X, ChevronDown,
} from 'lucide-react';

// ─── Platform Connector Config (GitHub + 官方文档) ────────
interface PlatformConfig {
  id: string;
  name: string;
  domain: string;
  icon: typeof BookOpen;
  iconBg: string;
  iconColor: string;
  authType: 'CDP' | 'OAuth2' | 'API_KEY' | 'COOKIE';
  authTypeLabel: string;
  docUrl: string;
  docSource: string;
  description: string;
  capabilities: string[];
  steps: string[];
  requiredFields: { key: string; label: string; placeholder: string }[];
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'xiaohongshu',
    name: '小红书',
    domain: 'xiaohongshu.com',
    icon: BookOpen,
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    authType: 'CDP',
    authTypeLabel: '浏览器 CDP',
    docUrl: 'https://open.xiaohongshu.com/document/doc',
    docSource: '小红书开放平台文档',
    description: '通过 Chrome DevTools Protocol 连接小红书商家后台，实现商品管理、订单处理、消息回复、笔记发布等操作。无需申请开放平台 API，通过浏览器会话直接操作。',
    capabilities: ['商品上下架', '订单处理', '消息回复', '笔记发布', '数据罗盘', '直播管理'],
    steps: [
      '使用 CDP 模式启动 Chrome 浏览器（端口 9222）',
      '在浏览器中登录小红书商家后台 (ark.xiaohongshu.com)',
      '在本页面点击「检测登录」确认会话状态',
      '连接成功后即可通过 AI 指令操作店铺',
    ],
    requiredFields: [
      { key: 'shopId', label: '店铺 ID', placeholder: '可选，从商家后台获取' },
    ],
  },
  {
    id: 'douyin',
    name: '抖音',
    domain: 'douyin.com',
    icon: Music,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    authType: 'OAuth2',
    authTypeLabel: 'OAuth2 授权',
    docUrl: 'https://developer.open-douyin.com/docs/resource/zh-CN/dop/develop/openapi',
    docSource: '抖音开放平台文档',
    description: '通过抖音开放平台 OAuth2 授权，管理抖店商品、订单、售后等。也可通过 CDP 模式连接抖店后台直接操作。',
    capabilities: ['商品管理', '订单管理', '售后处理', '消息客服', '直播管理', '达人带货'],
    steps: [
      '申请抖店开放平台应用 (developer.open-douyin.com)',
      '获取 AppKey 和 AppSecret',
      '配置 OAuth2 回调地址',
      '在本页面点击「登录引导」完成授权',
    ],
    requiredFields: [
      { key: 'shopId', label: '店铺 ID', placeholder: '抖店后台 → 店铺设置' },
      { key: 'appKey', label: 'AppKey', placeholder: '开放平台应用 AppKey' },
      { key: 'appSecret', label: 'AppSecret', placeholder: '开放平台应用 AppSecret' },
    ],
  },
  {
    id: 'taobao',
    name: '淘宝',
    domain: 'taobao.com',
    icon: ShoppingBag,
    iconBg: 'bg-warning/10',
    iconColor: 'text-warning',
    authType: 'OAuth2',
    authTypeLabel: 'OAuth2 授权',
    docUrl: 'https://open.taobao.com/api.htm',
    docSource: '淘宝开放平台文档',
    description: '通过淘宝/天猫开放平台授权，管理淘宝店铺商品、订单、物流等。支持 TOP API 接口调用。',
    capabilities: ['商品管理', '订单管理', '物流查询', '评价管理', '客服消息', '营销工具'],
    steps: [
      '申请淘宝开放平台应用 (open.taobao.com)',
      '创建应用并获取 AppKey 和 AppSecret',
      '授权店铺数据访问权限',
      '在本页面点击「登录引导」完成授权',
    ],
    requiredFields: [
      { key: 'shopId', label: '店铺 ID', placeholder: '卖家中心 → 店铺基础信息' },
      { key: 'appKey', label: 'AppKey', placeholder: '开放平台应用 AppKey' },
      { key: 'appSecret', label: 'AppSecret', placeholder: '开放平台应用 AppSecret' },
    ],
  },
  {
    id: 'pinduoduo',
    name: '拼多多',
    domain: 'pinduoduo.com',
    icon: Store,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    authType: 'OAuth2',
    authTypeLabel: 'OAuth2 授权',
    docUrl: 'https://open.pinduoduo.com/application/document/browse',
    docSource: '拼多多开放平台文档',
    description: '通过拼多多开放平台授权，管理拼多多店铺商品、订单和售后。',
    capabilities: ['商品管理', '订单管理', '售后处理', '物流管理', '多多进宝'],
    steps: [
      '申请拼多多开放平台应用 (open.pinduoduo.com)',
      '创建应用并获取 ClientId 和 ClientSecret',
      '配置回调地址并授权店铺',
      '在本页面点击「登录引导」完成授权',
    ],
    requiredFields: [
      { key: 'shopId', label: '店铺 ID', placeholder: '商家后台 → 店铺信息' },
      { key: 'clientId', label: 'ClientId', placeholder: '开放平台应用 ClientId' },
      { key: 'clientSecret', label: 'ClientSecret', placeholder: '开放平台应用 ClientSecret' },
    ],
  },
  {
    id: 'jd',
    name: '京东',
    domain: 'jd.com',
    icon: ShoppingBag,
    iconBg: 'bg-error/10',
    iconColor: 'text-error',
    authType: 'OAuth2',
    authTypeLabel: 'OAuth2 授权',
    docUrl: 'https://open.jd.com/home/home',
    docSource: '京东开放平台文档',
    description: '通过京东开放平台授权，管理京东店铺商品、订单和物流。',
    capabilities: ['商品管理', '订单管理', '物流管理', '售后处理', '促销管理'],
    steps: [
      '申请京东开放平台应用 (open.jd.com)',
      '创建应用并获取 AppKey 和 AppSecret',
      '授权店铺数据访问权限',
      '在本页面点击「登录引导」完成授权',
    ],
    requiredFields: [
      { key: 'shopId', label: '店铺 ID', placeholder: '商家后台 → 店铺设置' },
      { key: 'appKey', label: 'AppKey', placeholder: '开放平台应用 AppKey' },
      { key: 'appSecret', label: 'AppSecret', placeholder: '开放平台应用 AppSecret' },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    domain: 'tiktok.com',
    icon: Music2,
    iconBg: 'bg-surface-container-high',
    iconColor: 'text-on-surface-variant',
    authType: 'OAuth2',
    authTypeLabel: 'OAuth2 授权',
    docUrl: 'https://partner.tiktokshop.com/docv2/page/',
    docSource: 'TikTok Shop 开发者文档',
    description: '通过 TikTok Shop Partner API 授权，管理 TikTok Shop 跨境电商业务。',
    capabilities: ['商品管理', '订单管理', '物流管理', '达人营销', '直播管理'],
    steps: [
      '注册 TikTok Shop 开发者账号 (partner.tiktokshop.com)',
      '创建应用获取 App Key 和 App Secret',
      '配置 OAuth2 回调地址',
      '授权店铺数据访问',
    ],
    requiredFields: [
      { key: 'shopId', label: 'Shop ID', placeholder: 'TikTok Shop Seller Center' },
      { key: 'appKey', label: 'App Key', placeholder: 'Developer App Key' },
      { key: 'appSecret', label: 'App Secret', placeholder: 'Developer App Secret' },
    ],
  },
];

// ─── Platform Status (from mock API) ─────────────────────
interface PlatformStatus {
  platform: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'PENDING';
  accountName: string;
  connectedAt: string | null;
  browserConnected: boolean;
  lastSyncAt: string | null;
}

const MOCK_STATUSES: Record<string, PlatformStatus> = {
  xiaohongshu: { platform: 'xiaohongshu', status: 'CONNECTED', accountName: '设计师阿花', connectedAt: '2025-01-15', browserConnected: true, lastSyncAt: '2025-06-20 08:00' },
  douyin: { platform: 'douyin', status: 'CONNECTED', accountName: '好物推荐官', connectedAt: '2025-02-20', browserConnected: true, lastSyncAt: '2025-06-19 16:00' },
  taobao: { platform: 'taobao', status: 'CONNECTED', accountName: '潮流数码旗舰', connectedAt: '2025-03-10', browserConnected: false, lastSyncAt: '2025-06-18 12:00' },
  pinduoduo: { platform: 'pinduoduo', status: 'DISCONNECTED', accountName: '', connectedAt: null, browserConnected: false, lastSyncAt: null },
  jd: { platform: 'jd', status: 'PENDING', accountName: '', connectedAt: null, browserConnected: false, lastSyncAt: null },
  tiktok: { platform: 'tiktok', status: 'DISCONNECTED', accountName: '', connectedAt: null, browserConnected: false, lastSyncAt: null },
};

export function SettingsAccountsPage() {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [showConnectModal, setShowConnectModal] = useState<string | null>(null);
  const [browserConnected, setBrowserConnected] = useState(true);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONNECTED': return { label: '已连接', icon: CheckCircle, bg: 'bg-success/15', color: 'text-success' };
      case 'DISCONNECTED': return { label: '未连接', icon: AlertCircle, bg: 'bg-error/15', color: 'text-error' };
      case 'PENDING': return { label: '待配置', icon: AlertCircle, bg: 'bg-warning/15', color: 'text-warning' };
      default: return { label: '未知', icon: AlertCircle, bg: 'bg-surface-container-high', color: 'text-on-surface-variant' };
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-on-surface">平台账号管理</h1>
        <p className="text-sm text-on-surface-variant mt-1">管理 Chrome 浏览器连接与平台会话，通过 CDP 实现免授权操作</p>
      </div>

      {/* Browser Connection Status */}
      <div className="bg-surface rounded-lg shadow-card p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${browserConnected ? 'bg-success/10' : 'bg-error/10'} rounded-lg flex items-center justify-center`}>
                <Wifi className={`w-5 h-5 ${browserConnected ? 'text-success' : 'text-error'}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-on-surface">连接状态</span>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${browserConnected ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                    {browserConnected ? <><CheckCircle className="w-3 h-3" />已连接</> : <><AlertCircle className="w-3 h-3" />未连接</>}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {browserConnected ? '浏览器已通过 CDP 协议成功连接' : '浏览器未连接，请先启动 CDP 模式的 Chrome'}
                </p>
              </div>
            </div>
            {browserConnected && (
              <>
                <div className="h-8 w-px bg-outline-variant/50" />
                <div className="flex items-center gap-5">
                  <div><p className="text-xs text-on-surface-variant">Chrome 版本</p><p className="text-sm font-medium text-on-surface mt-0.5">131.0.6778.86</p></div>
                  <div><p className="text-xs text-on-surface-variant">连接时长</p><p className="text-sm font-medium text-on-surface mt-0.5">02:34:18</p></div>
                  <div><p className="text-xs text-on-surface-variant">调试端口</p><p className="text-sm font-medium text-on-surface mt-0.5">9222</p></div>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href="https://chromedevtools.github.io/devtools-protocol/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
              <LifeBuoy className="w-3.5 h-3.5" />CDP 帮助
            </a>
            {browserConnected ? (
              <>
                <button
                  onClick={() => setBrowserConnected(false)}
                  className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2"
                >
                  <Unplug className="w-3.5 h-3.5" />断开连接
                </button>
                <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
                  <Camera className="w-3.5 h-3.5" />截图
                </button>
              </>
            ) : (
              <button
                onClick={() => setBrowserConnected(true)}
                className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2"
              >
                <Plug className="w-3.5 h-3.5" />连接浏览器
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Platform Accounts List */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-on-surface-variant" />
            <h2 className="text-sm font-semibold text-on-surface">平台账号</h2>
            <span className="text-xs text-on-surface-variant ml-1">{PLATFORM_CONFIGS.length} 个平台</span>
          </div>
          <button className="bg-primary text-on-primary px-3.5 py-1.5 rounded-md text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
            <SearchCheck className="w-3.5 h-3.5" />一键检测已登录平台
          </button>
        </div>
        <div>
          {PLATFORM_CONFIGS.map((platform, i) => {
            const Icon = platform.icon;
            const status = MOCK_STATUSES[platform.id];
            const badge = getStatusBadge(status?.status || 'DISCONNECTED');
            const BadgeIcon = badge.icon;
            const isExpanded = expandedPlatform === platform.id;

            return (
              <div key={platform.id}>
                <div
                  className={`flex items-center justify-between px-5 py-3.5 hover:bg-surface-container/50 transition-colors cursor-pointer ${i < PLATFORM_CONFIGS.length - 1 ? 'border-b border-outline-variant/20' : ''}`}
                  onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${platform.iconBg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${platform.iconColor}`} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-on-surface">{platform.name}</span>
                      <span className="text-xs text-on-surface-variant ml-2">{platform.domain}</span>
                      {status?.accountName && (
                        <span className="text-xs text-on-surface-variant ml-2">· {status.accountName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-container text-on-surface-variant">
                      {platform.authTypeLabel}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
                      <BadgeIcon className="w-3 h-3" />{badge.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="bg-surface-container-lowest/50 border-b border-outline-variant/20">
                    <div className="px-5 py-4 space-y-4">
                      {/* Description */}
                      <p className="text-sm text-on-surface-variant">{platform.description}</p>

                      {/* Auth Type & Doc Link */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-on-surface-variant" />
                          <span className="text-xs text-on-surface-variant">授权方式: </span>
                          <span className="text-xs font-medium text-on-surface">{platform.authTypeLabel}</span>
                        </div>
                        <a
                          href={platform.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />{platform.docSource}
                        </a>
                      </div>

                      {/* Capabilities */}
                      <div>
                        <p className="text-xs font-medium text-on-surface mb-2">支持能力</p>
                        <div className="flex flex-wrap gap-1.5">
                          {platform.capabilities.map(cap => (
                            <span key={cap} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-surface-container text-on-surface-variant">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Connection Steps */}
                      <div>
                        <p className="text-xs font-medium text-on-surface mb-2">连接步骤</p>
                        <div className="space-y-2">
                          {platform.steps.map((step, si) => (
                            <div key={si} className="flex gap-2">
                              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">{si + 1}</span>
                              <p className="text-xs text-on-surface-variant">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Required Fields for OAuth2 */}
                      {platform.authType === 'OAuth2' && platform.requiredFields.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-on-surface mb-2">必填配置</p>
                          <div className="grid grid-cols-3 gap-3">
                            {platform.requiredFields.map(field => (
                              <div key={field.key}>
                                <label className="text-xs text-on-surface-variant block mb-1">{field.label}</label>
                                <input
                                  type="text"
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-1.5 rounded-md border border-outline-variant/50 bg-surface text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3 pt-1">
                        {status?.status === 'CONNECTED' ? (
                          <>
                            <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                              <RefreshCw className="w-3.5 h-3.5" />同步数据
                            </button>
                            <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
                              <Settings className="w-3.5 h-3.5" />配置
                            </button>
                            <button className="bg-surface-container text-error px-4 py-2 rounded-md text-sm font-medium hover:bg-error/10 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                              <Unplug className="w-3.5 h-3.5" />断开连接
                            </button>
                          </>
                        ) : (
                          <>
                            {platform.authType === 'CDP' ? (
                              <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                                <SearchCheck className="w-3.5 h-3.5" />检测登录
                              </button>
                            ) : (
                              <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
                                <LogIn className="w-3.5 h-3.5" />登录引导
                              </button>
                            )}
                            <a
                              href={platform.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />查看文档
                            </a>
                          </>
                        )}
                      </div>

                      {/* Last Sync Info */}
                      {status?.status === 'CONNECTED' && status.lastSyncAt && (
                        <p className="text-xs text-on-surface-variant">最近同步: {status.lastSyncAt}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* CDP Guide */}
      <div className="bg-surface rounded-lg shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-on-surface">Chrome 调试配置说明</h2>
        </div>
        <div className="space-y-3 text-sm text-on-surface-variant">
          {[
            '关闭所有正在运行的 Chrome 窗口和进程，确保没有后台 Chrome 进程占用调试端口。',
            '使用命令行启动 Chrome 并开启远程调试端口: chrome --remote-debugging-port=9222',
            '启动后在本页面点击「CDP 帮助」按钮，系统将自动检测连接状态并引导您完成配置。',
            '连接成功后，系统会自动扫描浏览器中已登录的平台，无需手动输入账号密码。',
          ].map((text, i) => (
            <div key={i} className="flex gap-3">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center mt-0.5">{i + 1}</span>
              <p>{text}</p>
            </div>
          ))}
          <div className="mt-3 p-3 bg-warning/5 border border-warning/15 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
              <p className="text-xs text-warning">请勿在调试模式下登录银行等敏感网站，调试模式下浏览器安全性会降低。建议仅在调试模式下使用电商平台账号。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface rounded-xl shadow-dialog w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-on-surface">
                连接 {PLATFORM_CONFIGS.find(p => p.id === showConnectModal)?.name}
              </h3>
              <button onClick={() => setShowConnectModal(null)} className="p-1 rounded hover:bg-surface-container">
                <X className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>
            <p className="text-sm text-on-surface-variant mb-4">
              {PLATFORM_CONFIGS.find(p => p.id === showConnectModal)?.description}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConnectModal(null)} className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high">
                取消
              </button>
              <button onClick={() => setShowConnectModal(null)} className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90">
                确认连接
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
