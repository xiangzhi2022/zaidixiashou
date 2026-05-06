import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main">
        <Topbar />
        <section className="command-center">
          <div>
            <strong>AI 指挥台</strong>
            <p>输入运营目标或平台操作，AI 会先分析，再把高风险动作放入审批队列。</p>
          </div>
          <form className="command-form">
            <input aria-label="自然语言命令" defaultValue="帮我汇总今天电商订单、媒体互动和待审核发布内容" />
            <button type="button">执行</button>
          </form>
        </section>
        <Outlet />
      </main>
    </div>
  );
}
