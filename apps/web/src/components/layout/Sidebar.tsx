import { BarChart3, Bot, FileCheck2, ImagePlus, KeyRound, LayoutDashboard, MessageSquare, PackageSearch, ShieldCheck, ShoppingBag, Workflow } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navSections = [
  {
    title: '电商运营',
    items: [
      { to: '/overview', label: '总览', icon: LayoutDashboard },
      { to: '/commerce/orders', label: '订单', icon: ShoppingBag },
      { to: '/commerce/products', label: '商品', icon: PackageSearch },
      { to: '/commerce/messages', label: '消息', icon: MessageSquare, badge: '64' }
    ]
  },
  {
    title: '媒体运营',
    items: [
      { to: '/media/center', label: '运营中心', icon: BarChart3, badge: '126' },
      { to: '/media/creative', label: '图像视频生成', icon: ImagePlus },
      { to: '/media/drafts', label: '草稿审核发布', icon: FileCheck2, badge: '4' },
      { to: '/media/automation', label: '自动化', icon: Workflow }
    ]
  },
  {
    title: '系统设置',
    items: [
      { to: '/settings/accounts', label: '平台账号管理', icon: KeyRound, badge: '3' },
      { to: '/settings/autopilot', label: '自动托管模式', icon: Bot },
      { to: '/settings/approval', label: '审批', icon: ShieldCheck }
    ]
  }
];

export function Sidebar() {
  return (
    <aside className="sidebar" aria-label="主导航">
      <div className="brand">
        <span className="brand-mark">AI</span>
        <div>
          <strong>Commerce Ops</strong>
          <span>跨境电商中控台</span>
        </div>
      </div>
      <nav className="nav-list">
        {navSections.map((section) => (
          <section className="nav-section" key={section.title}>
            <p className="nav-title">{section.title}</p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink className="nav-item" key={item.to} to={item.to}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                  {item.badge ? <strong className="nav-bubble">{item.badge}</strong> : null}
                </NavLink>
              );
            })}
          </section>
        ))}
      </nav>
    </aside>
  );
}
