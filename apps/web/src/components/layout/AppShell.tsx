import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div className="bg-background text-on-surface font-sans min-h-screen">
      {/* Top header bar */}
      <Topbar />

      {/* Body: sidebar + main content */}
      <div className="flex" style={{ height: 'calc(100vh - 3.5rem)' }}>
        <Sidebar />
        <main className="flex-1 min-w-0 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
