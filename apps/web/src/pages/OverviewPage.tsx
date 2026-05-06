import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ShoppingBag, PackageSearch, MessageSquare,
  UserPlus, BarChart3, ImagePlus, FileCheck2,
  TrendingUp, Users, Zap, DollarSign
} from 'lucide-react';

interface OverviewStats {
  totalProspects: number;
  contactedProspects: number;
  conversionRate: number;
  activeTasks: number;
  activeCampaigns: number;
}

interface SubscriptionInfo {
  plan: string;
  status: string;
  aiQuota: number;
  aiUsed: number;
  cdpConcurrent: number;
  acquisitionTasks: number;
  platformApis: number;
}

interface PlatformAccount {
  id: string;
  platform: string;
  displayName: string;
  status: string;
}

export function OverviewPage() {
  const { user } = useAuth();
  const [acquisitionStats, setAcquisitionStats] = useState<OverviewStats | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, subRes, accRes] = await Promise.allSettled([
          apiClient.get('/acquisition/stats'),
          apiClient.get('/subscriptions/current'),
          apiClient.get('/platform-accounts'),
        ]);
        if (statsRes.status === 'fulfilled') setAcquisitionStats(statsRes.value.data);
        if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
        if (accRes.status === 'fulfilled') setAccounts(accRes.value.data?.data ?? accRes.value.data ?? []);
      } catch {
        // Silently handle - will show defaults
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const connectedAccounts = accounts.filter(a => a.status === 'CONNECTED').length;
  const aiUsagePercent = subscription
    ? subscription.aiQuota === -1 ? 0 : Math.round((subscription.aiUsed / subscription.aiQuota) * 100)
    : 0;

  const metricCards = [
    {
      label: '潜客总数',
      value: acquisitionStats?.totalProspects ?? 0,
      icon: Users,
      color: '#2F6BFF',
      bg: '#EEF4FF',
    },
    {
      label: '已触达',
      value: acquisitionStats?.contactedProspects ?? 0,
      icon: TrendingUp,
      color: '#16A37B',
      bg: '#E6F7F0',
    },
    {
      label: '转化率',
      value: `${acquisitionStats?.conversionRate ?? 0}%`,
      icon: Zap,
      color: '#F59E0B',
      bg: '#FEF6E6',
    },
    {
      label: '已连接平台',
      value: connectedAccounts,
      icon: DollarSign,
      color: '#8B5CF6',
      bg: '#F3EEFF',
    },
  ];

  const quickActions = [
    { label: '订单管理', icon: ShoppingBag, path: '/commerce/orders' },
    { label: '商品管理', icon: PackageSearch, path: '/commerce/products' },
    { label: '消息中心', icon: MessageSquare, path: '/commerce/messages' },
    { label: '获客中心', icon: UserPlus, path: '/acquisition' },
    { label: '运营中心', icon: BarChart3, path: '/media/center' },
    { label: '内容创作', icon: ImagePlus, path: '/media/creative' },
    { label: '草稿审核', icon: FileCheck2, path: '/media/drafts' },
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="overview-loading">
          <div className="spinner" />
          <p>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Welcome */}
      <div className="overview-welcome">
        <h1 className="page-title">
          <LayoutDashboard size={22} />
          总览
        </h1>
        <p className="page-desc">欢迎回来，{user?.name || '用户'}。以下是您的运营概况。</p>
      </div>

      {/* Metric Cards */}
      <div className="metric-grid">
        {metricCards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="metric-card">
              <div className="metric-icon" style={{ color: card.color, background: card.bg }}>
                <Icon size={20} />
              </div>
              <div className="metric-info">
                <span className="metric-value">{card.value}</span>
                <span className="metric-label">{card.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subscription & Quota */}
      {subscription && (
        <div className="overview-section">
          <h2 className="section-title">订阅与配额</h2>
          <div className="quota-grid">
            <div className="quota-card">
              <div className="quota-header">
                <span className="quota-label">当前套餐</span>
                <span className="plan-badge">{subscription.plan}</span>
              </div>
              <div className="quota-item">
                <span className="quota-name">AI 调用</span>
                <div className="quota-bar-wrap">
                  <div className="quota-bar" style={{ width: `${aiUsagePercent}%` }} />
                </div>
                <span className="quota-num">
                  {subscription.aiQuota === -1 ? '无限' : `${subscription.aiUsed}/${subscription.aiQuota}`}
                </span>
              </div>
              <div className="quota-item">
                <span className="quota-name">CDP 并发</span>
                <span className="quota-num">
                  {subscription.cdpConcurrent === -1 ? '无限' : subscription.cdpConcurrent}
                </span>
              </div>
              <div className="quota-item">
                <span className="quota-name">获客任务</span>
                <span className="quota-num">
                  {subscription.acquisitionTasks === -1 ? '无限' : subscription.acquisitionTasks}
                </span>
              </div>
            </div>

            <div className="quota-card">
              <h3 className="card-subtitle">获客概览</h3>
              <div className="stat-row">
                <span>进行中的任务</span>
                <strong>{acquisitionStats?.activeTasks ?? 0}</strong>
              </div>
              <div className="stat-row">
                <span>进行中的活动</span>
                <strong>{acquisitionStats?.activeCampaigns ?? 0}</strong>
              </div>
              <div className="stat-row">
                <span>已触达潜客</span>
                <strong>{acquisitionStats?.contactedProspects ?? 0}</strong>
              </div>
              <div className="stat-row">
                <span>转化率</span>
                <strong>{acquisitionStats?.conversionRate ?? 0}%</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="overview-section">
        <h2 className="section-title">快捷操作</h2>
        <div className="quick-grid">
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path} className="quick-card">
                <Icon size={20} />
                <span>{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
