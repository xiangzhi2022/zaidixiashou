import { useEffect, useState, useCallback } from 'react';
import { apiClient } from '../api/client';
import {
  CreditCard, ArrowUpCircle, Receipt,
  Package, Zap, Monitor, UserPlus, Shield
} from 'lucide-react';

interface CurrentSubscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface QuotaInfo {
  aiUsed: number;
  aiQuota: number;
  aiRemaining: number;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string;
  createdAt: string;
}

const PLAN_FEATURES: Record<string, { aiQuota: number; cdpConcurrent: number; acquisitionTasks: number; platformApis: number; price: number }> = {
  FREE: { aiQuota: 100, cdpConcurrent: 1, acquisitionTasks: 5, platformApis: 2, price: 0 },
  STARTER: { aiQuota: 2000, cdpConcurrent: 2, acquisitionTasks: 50, platformApis: 5, price: 99 },
  PROFESSIONAL: { aiQuota: 10000, cdpConcurrent: 5, acquisitionTasks: 200, platformApis: 20, price: 299 },
  ENTERPRISE: { aiQuota: -1, cdpConcurrent: -1, acquisitionTasks: -1, platformApis: -1, price: 999 },
};

const PLAN_LABELS: Record<string, string> = {
  FREE: '免费版',
  STARTER: '入门版',
  PROFESSIONAL: '专业版',
  ENTERPRISE: '企业版',
};

const PLAN_COLORS: Record<string, string> = {
  FREE: '#6B7280',
  STARTER: '#2F6BFF',
  PROFESSIONAL: '#8B5CF6',
  ENTERPRISE: '#F59E0B',
};

export function SettingsBillingPage() {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, quotaRes, invRes] = await Promise.allSettled([
        apiClient.get('/subscriptions/current'),
        apiClient.get('/subscriptions/quota'),
        apiClient.get('/payments/history'),
      ]);
      if (subRes.status === 'fulfilled') setSubscription(subRes.value.data?.data ?? subRes.value.data);
      if (quotaRes.status === 'fulfilled') setQuota(quotaRes.value.data?.data ?? quotaRes.value.data);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value.data?.data ?? invRes.value.data ?? []);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const currentPlan = subscription?.plan ?? 'FREE';
  const planFeature = PLAN_FEATURES[currentPlan] ?? PLAN_FEATURES.FREE!;
  const aiUsagePercent = quota ? (quota.aiQuota === -1 ? 0 : Math.round((quota.aiUsed / quota.aiQuota) * 100)) : 0;

  const handleUpgrade = async (plan: string) => {
    setUpgrading(true);
    try {
      await apiClient.post('/subscriptions/upgrade', { plan });
      fetchData();
    } catch { /* handle error */ }
    finally {
      setUpgrading(false);
    }
  };

  const planOrder = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

  return (
    <div className="page-container">
      <h1 className="page-title"><CreditCard size={22} /> 订阅与账单</h1>
      <p className="page-desc">管理订阅套餐、查看配额用量和账单记录</p>

      {/* Current Plan */}
      <div className="settings-card billing-current">
        <div className="card-header">
          <h2><Package size={18} /> 当前套餐</h2>
          <span className="plan-badge-large" style={{ background: PLAN_COLORS[currentPlan] }}>
            {PLAN_LABELS[currentPlan]}
          </span>
        </div>
        <div className="billing-usage">
          <div className="usage-item">
            <div className="usage-header">
              <Zap size={14} />
              <span>AI 调用额度</span>
              <span className="usage-num">
                {quota ? (quota.aiQuota === -1 ? '无限' : `${quota.aiUsed} / ${quota.aiQuota}`) : '-'}
              </span>
            </div>
            <div className="usage-bar">
              <div className="usage-fill" style={{ width: `${Math.min(aiUsagePercent, 100)}%` }} />
            </div>
          </div>
          <div className="usage-row">
            <div className="usage-stat">
              <Monitor size={14} />
              <span>CDP 并发</span>
              <strong>{planFeature.cdpConcurrent === -1 ? '无限' : planFeature.cdpConcurrent}</strong>
            </div>
            <div className="usage-stat">
              <UserPlus size={14} />
              <span>获客任务</span>
              <strong>{planFeature.acquisitionTasks === -1 ? '无限' : planFeature.acquisitionTasks}</strong>
            </div>
            <div className="usage-stat">
              <Shield size={14} />
              <span>平台 API</span>
              <strong>{planFeature.platformApis === -1 ? '无限' : planFeature.platformApis}</strong>
            </div>
          </div>
        </div>
        {subscription && (
          <div className="billing-period">
            <span>当前周期：{new Date(subscription.currentPeriodStart).toLocaleDateString()} ~ {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
            {subscription.cancelAtPeriodEnd && <span className="cancel-notice">到期后将取消</span>}
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="settings-card">
        <div className="card-header">
          <h2><ArrowUpCircle size={18} /> 套餐对比</h2>
        </div>
        <div className="plan-grid">
          {planOrder.map(plan => {
            const feat = PLAN_FEATURES[plan] ?? PLAN_FEATURES.FREE!;
            const isCurrent = plan === currentPlan;
            return (
              <div key={plan} className={`plan-card ${isCurrent ? 'plan-current' : ''}`}>
                {isCurrent && <div className="plan-current-tag">当前套餐</div>}
                <div className="plan-name" style={{ color: PLAN_COLORS[plan] }}>{PLAN_LABELS[plan]}</div>
                <div className="plan-price">
                  <span className="price-amount">¥{feat.price}</span>
                  <span className="price-interval">/月</span>
                </div>
                <div className="plan-features">
                  <div className="plan-feature">
                    <Zap size={12} />
                    <span>AI 调用: {feat.aiQuota === -1 ? '无限' : feat.aiQuota.toLocaleString()}</span>
                  </div>
                  <div className="plan-feature">
                    <Monitor size={12} />
                    <span>CDP 并发: {feat.cdpConcurrent === -1 ? '无限' : feat.cdpConcurrent}</span>
                  </div>
                  <div className="plan-feature">
                    <UserPlus size={12} />
                    <span>获客任务: {feat.acquisitionTasks === -1 ? '无限' : feat.acquisitionTasks}</span>
                  </div>
                  <div className="plan-feature">
                    <Shield size={12} />
                    <span>平台 API: {feat.platformApis === -1 ? '无限' : feat.platformApis}</span>
                  </div>
                </div>
                {!isCurrent && (
                  <button
                    className="btn-upgrade"
                    style={{ background: PLAN_COLORS[plan] }}
                    onClick={() => handleUpgrade(plan)}
                    disabled={upgrading}
                  >
                    {upgrading ? '处理中...' : '升级'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <div className="settings-card">
        <div className="card-header">
          <h2><Receipt size={18} /> 账单记录</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="acq-empty">
            <Receipt size={32} />
            <p>暂无账单记录</p>
          </div>
        ) : (
          <table className="acq-table">
            <thead>
              <tr>
                <th>金额</th>
                <th>状态</th>
                <th>支付时间</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.id}>
                  <td><strong>¥{inv.amount}</strong></td>
                  <td>
                    <span className="status-badge" style={{ background: inv.status === 'PAID' ? '#16A37B' : '#F59E0B' }}>
                      {inv.status === 'PAID' ? '已支付' : inv.status === 'PENDING' ? '待支付' : inv.status}
                    </span>
                  </td>
                  <td>{inv.paidAt ? new Date(inv.paidAt).toLocaleString() : '-'}</td>
                  <td>{new Date(inv.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
