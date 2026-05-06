import {
  LayoutDashboard,
  ShoppingBag,
  PackageSearch,
  MessageSquare,
  UserPlus,
  BarChart3,
  ImagePlus,
  FileCheck2,
  Workflow,
  KeyRound,
  Cpu,
  CreditCard,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navSections = [
  {
    title: '电商运营',
    items: [
      { to: '/overview', label: '总览', icon: LayoutDashboard },
      { to: '/commerce/orders', label: '订单', icon: ShoppingBag },
      { to: '/commerce/products', label: '商品', icon: PackageSearch },
      { to: '/commerce/messages', label: '消息', icon: MessageSquare, badge: '64' },
    ],
  },
  {
    title: '获客',
    items: [
      { to: '/acquisition', label: '获客中心', icon: UserPlus, badge: '326' },
    ],
  },
  {
    title: '媒体运营',
    items: [
      { to: '/media/center', label: '运营中心', icon: BarChart3, badge: '126' },
      { to: '/media/creative', label: '图像视频生成', icon: ImagePlus },
      { to: '/media/drafts', label: '草稿审核发布', icon: FileCheck2, badge: '4' },
      { to: '/media/automation', label: '自动化', icon: Workflow },
    ],
  },
  {
    title: '系统设置',
    items: [
      { to: '/settings/accounts', label: '平台账号管理', icon: KeyRound, badge: '3' },
      { to: '/settings/ai-models', label: 'AI模型设置', icon: Cpu },
      { to: '/settings/billing', label: '订阅与账单', icon: CreditCard },
      { to: '/settings/autopilot', label: '自动托管', icon: Bot },
      { to: '/settings/approval', label: '审批', icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 bg-surface border-r border-outline-variant/20 overflow-y-auto">
      <div className="p-3 space-y-0.5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 py-1 mt-2 text-xs font-medium text-on-surface-variant/60 uppercase tracking-wider">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`ml-auto text-xs rounded-full px-1.5 py-0.5 leading-none ${
                        section.title === '电商运营'
                          ? 'bg-error text-white'
                          : 'bg-warning text-on-surface'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
