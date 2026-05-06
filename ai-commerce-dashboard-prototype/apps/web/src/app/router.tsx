import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { PlaceholderPage } from '../pages/PlaceholderPage';

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/overview" replace /> },
      { path: '/overview', element: <PlaceholderPage title="总览" moduleName="运营中心" /> },
      { path: '/commerce/orders', element: <PlaceholderPage title="订单" moduleName="电商运营" /> },
      { path: '/commerce/products', element: <PlaceholderPage title="商品" moduleName="电商运营" /> },
      { path: '/commerce/messages', element: <PlaceholderPage title="消息" moduleName="电商运营" /> },
      { path: '/media/center', element: <PlaceholderPage title="运营中心" moduleName="媒体运营" /> },
      { path: '/media/creative', element: <PlaceholderPage title="图像视频生成" moduleName="媒体运营" /> },
      { path: '/media/drafts', element: <PlaceholderPage title="草稿审核发布" moduleName="媒体运营" /> },
      { path: '/media/automation', element: <PlaceholderPage title="自动化" moduleName="媒体运营" /> },
      { path: '/settings/accounts', element: <PlaceholderPage title="平台账号管理" moduleName="系统设置" /> },
      { path: '/settings/autopilot', element: <PlaceholderPage title="自动托管模式" moduleName="系统设置" /> },
      { path: '/settings/approval', element: <PlaceholderPage title="审批" moduleName="系统设置" /> }
    ]
  }
]);

