interface PlaceholderPageProps {
  title: string;
  moduleName: string;
}

export function PlaceholderPage({ title, moduleName }: PlaceholderPageProps) {
  return (
    <section className="page-card">
      <p className="eyebrow">{moduleName}</p>
      <h2>{title}</h2>
      <p>这是 M0 路由占位页。M1 会接入 Mock API 并还原完整静态原型 UI。</p>
    </section>
  );
}
