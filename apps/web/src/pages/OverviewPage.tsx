export function OverviewPage() {
  return <PlaceholderPage title="总览" />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page-container">
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">功能开发中...</p>
    </div>
  );
}
