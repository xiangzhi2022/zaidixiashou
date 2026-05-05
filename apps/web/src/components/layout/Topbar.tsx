import { useAuth } from '../../contexts/AuthContext';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">AI Commerce Ops</p>
        <h1>跨境电商 AI 运营中控台</h1>
      </div>
      <div className="topbar-actions">
        <span className="topbar-user">{user?.phone || user?.name || '用户'}</span>
        <button type="button" onClick={logout} className="btn-ghost">退出</button>
      </div>
    </header>
  );
}
