import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { AuthGuard } from '../components/AuthGuard';
import PlaceholderPage from '../pages/PlaceholderPage';
import { OverviewPage } from '../pages/OverviewPage';
import { AcquisitionPage } from '../pages/AcquisitionPage';
import { SettingsAccountsPage } from '../pages/SettingsAccountsPage';
import { SettingsAiModelsPage } from '../pages/SettingsAiModelsPage';
import { SettingsBillingPage } from '../pages/SettingsBillingPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppShell />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/overview" replace /> },
      { path: 'overview', element: <OverviewPage /> },
      { path: 'commerce/orders', element: <PlaceholderPage title="订单" /> },
      { path: 'commerce/products', element: <PlaceholderPage title="商品" /> },
      { path: 'commerce/messages', element: <PlaceholderPage title="消息" /> },
      { path: 'acquisition', element: <AcquisitionPage /> },
      { path: 'media/center', element: <PlaceholderPage title="运营中心" /> },
      { path: 'media/creative', element: <PlaceholderPage title="图像视频生成" /> },
      { path: 'media/drafts', element: <PlaceholderPage title="草稿审核发布" /> },
      { path: 'media/automation', element: <PlaceholderPage title="自动化" /> },
      { path: 'settings/accounts', element: <SettingsAccountsPage /> },
      { path: 'settings/ai-models', element: <SettingsAiModelsPage /> },
      { path: 'settings/billing', element: <SettingsBillingPage /> },
      { path: 'settings/autopilot', element: <PlaceholderPage title="自动托管模式" /> },
      { path: 'settings/approval', element: <PlaceholderPage title="审批" /> },
    ],
  },
]);
