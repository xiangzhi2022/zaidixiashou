export function SettingsAiModelsPage() {
  return <PlaceholderPage title="AI模型设置" />;
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="page-container">
      <h1 className="page-title">{title}</h1>
      <p className="page-desc">功能开发中...</p>
    </div>
  );
}
