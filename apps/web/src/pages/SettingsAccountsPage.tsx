import {
  Wifi,
  Unplug,
  Camera,
  LifeBuoy,
  Globe,
  BookOpen,
  Music,
  Music2,
  SearchCheck,
  LogIn,
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
} from 'lucide-react';

const platforms = [
  { name: '小红书', domain: 'xiaohongshu.com', icon: BookOpen, iconBg: 'bg-error/10', iconColor: 'text-error', status: '需登录', statusIcon: AlertCircle, statusBg: 'bg-warning/15', statusColor: 'text-warning', action: '检测登录', actionIcon: SearchCheck },
  { name: '抖音', domain: 'douyin.com', icon: Music, iconBg: 'bg-primary/10', iconColor: 'text-primary', status: '待授权', statusIcon: AlertCircle, statusBg: 'bg-warning/15', statusColor: 'text-warning', action: '登录引导', actionIcon: LogIn },
  { name: 'TikTok', domain: 'tiktok.com', icon: Music2, iconBg: 'bg-surface-container-high', iconColor: 'text-on-surface-variant', status: '可接入', statusIcon: CheckCircle, statusBg: 'bg-success/15', statusColor: 'text-success', action: '检测登录', actionIcon: SearchCheck },
  { name: 'Instagram', domain: 'instagram.com', icon: Camera, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500', status: '已连接', statusIcon: CheckCircle, statusBg: 'bg-success/15', statusColor: 'text-success', action: '断开', actionIcon: Unplug },
];

export function SettingsAccountsPage() {
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
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center"><Wifi className="w-5 h-5 text-success" /></div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-on-surface">连接状态</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
                    <CheckCircle className="w-3 h-3" />已连接
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">浏览器已通过 CDP 协议成功连接</p>
              </div>
            </div>
            <div className="h-8 w-px bg-outline-variant/50" />
            <div className="flex items-center gap-5">
              <div><p className="text-xs text-on-surface-variant">Chrome 版本</p><p className="text-sm font-medium text-on-surface mt-0.5">131.0.6778.86</p></div>
              <div><p className="text-xs text-on-surface-variant">连接时长</p><p className="text-sm font-medium text-on-surface mt-0.5">02:34:18</p></div>
              <div><p className="text-xs text-on-surface-variant">调试端口</p><p className="text-sm font-medium text-on-surface mt-0.5">9222</p></div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="bg-primary text-on-primary px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <LifeBuoy className="w-3.5 h-3.5" />CDP 帮助
            </button>
            <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <Unplug className="w-3.5 h-3.5" />断开连接
            </button>
            <button className="bg-surface-container text-on-surface px-4 py-2 rounded-md text-sm font-medium hover:bg-surface-container-high active:scale-[0.98] transition-all inline-flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" />截图
            </button>
          </div>
        </div>
      </div>

      {/* Platform Sessions */}
      <div className="bg-surface rounded-lg shadow-card overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-on-surface-variant" />
            <h2 className="text-sm font-semibold text-on-surface">平台会话</h2>
            <span className="text-xs text-on-surface-variant ml-1">4 个平台</span>
          </div>
          <button className="bg-primary text-on-primary px-3.5 py-1.5 rounded-md text-xs font-medium hover:opacity-90 active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
            <SearchCheck className="w-3.5 h-3.5" />一键检测已登录平台
          </button>
        </div>
        <div>
          {platforms.map((p, i) => {
            const Icon = p.icon;
            const StatusIcon = p.statusIcon;
            const ActionIcon = p.actionIcon;
            return (
              <div key={p.name} className={`flex items-center justify-between px-5 py-3.5 hover:bg-surface-container/50 transition-colors ${i < platforms.length - 1 ? 'border-b border-outline-variant/20' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${p.iconBg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${p.iconColor}`} /></div>
                  <div>
                    <span className="text-sm font-medium text-on-surface">{p.name}</span>
                    <span className="text-xs text-on-surface-variant ml-2">{p.domain}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.statusBg} ${p.statusColor}`}>
                    <StatusIcon className="w-3 h-3 mr-1" />{p.status}
                  </span>
                  <button className={`text-${p.action === '断开' ? 'on-surface-variant' : 'primary'} text-xs font-medium hover:underline inline-flex items-center gap-1`}>
                    <ActionIcon className="w-3 h-3" />{p.action}
                  </button>
                </div>
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
            '使用命令行启动 Chrome 并开启远程调试端口，默认端口号为 9222。',
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
    </>
  );
}
