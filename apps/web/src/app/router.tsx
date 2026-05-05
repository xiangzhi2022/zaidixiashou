import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { AuthGuard } from '../components/AuthGuard';
import { OverviewPage } from '../pages/OverviewPage';
import { OrdersPage } from '../pages/OrdersPage';
import { ProductsPage } from '../pages/ProductsPage';
import { MessagesPage } from '../pages/MessagesPage';
import { AcquisitionPage } from '../pages/AcquisitionPage';
import { MediaPage } from '../pages/MediaPage';
import { MediaCreativePage } from '../pages/MediaCreativePage';
import { MediaDraftsPage } from '../pages/MediaDraftsPage';
import { AutomationPage } from '../pages/AutomationPage';
import { SettingsAccountsPage } from '../pages/SettingsAccountsPage';
import { SettingsAIModelsPage } from '../pages/SettingsAIModelsPage';
import { SettingsBillingPage } from '../pages/SettingsBillingPage';
import { SettingsAutopilotPage } from '../pages/SettingsAutopilotPage';
import { SettingsApprovalPage } from '../pages/SettingsApprovalPage';

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
      { path: 'commerce/orders', element: <OrdersPage /> },
      { path: 'commerce/products', element: <ProductsPage /> },
      { path: 'commerce/messages', element: <MessagesPage /> },
      { path: 'acquisition', element: <AcquisitionPage /> },
      { path: 'media/center', element: <MediaPage /> },
      { path: 'media/creative', element: <MediaCreativePage /> },
      { path: 'media/drafts', element: <MediaDraftsPage /> },
      { path: 'media/automation', element: <AutomationPage /> },
      { path: 'settings/accounts', element: <SettingsAccountsPage /> },
      { path: 'settings/ai-models', element: <SettingsAIModelsPage /> },
      { path: 'settings/billing', element: <SettingsBillingPage /> },
      { path: 'settings/autopilot', element: <SettingsAutopilotPage /> },
      { path: 'settings/approval', element: <SettingsApprovalPage /> },
    ],
  },
]);
