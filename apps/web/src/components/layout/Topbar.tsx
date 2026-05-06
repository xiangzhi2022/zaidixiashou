import { Bell, Zap, Terminal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function Topbar() {
  const { user, logout } = useAuth();
  const displayName = user?.name || user?.phone || '用户';
  const initial = displayName.charAt(0);

  return (
    <header className="bg-surface sticky top-0 z-40 h-14 flex items-center justify-between px-5 border-b border-outline-variant/20">
      <div className="flex items-center gap-2.5">
        <Zap className="w-5 h-5 text-primary" />
        <span className="font-bold text-base text-on-surface">AI Commerce Ops</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-container rounded-md px-3 py-1.5 text-sm text-on-surface-variant">
          <Terminal className="w-4 h-4" />
          <span>输入运营目标，AI 帮你执行</span>
        </div>
        <button className="relative p-2 rounded-md hover:bg-surface-container transition-colors">
          <Bell className="w-4 h-4 text-on-surface-variant" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full" />
        </button>
        <button
          onClick={logout}
          className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium hover:bg-primary/20 transition-colors"
          title={displayName}
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
