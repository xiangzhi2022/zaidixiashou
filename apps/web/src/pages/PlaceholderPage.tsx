interface PlaceholderPageProps {
  title: string;
  moduleName?: string;
}

export default function PlaceholderPage({ title, moduleName }: PlaceholderPageProps) {
  return (
    <section className="page-card">
      {moduleName && <p className="eyebrow">{moduleName}</p>}
      <h2>{title}</h2>
      <p>页面开发中，即将接入完整功能。</p>
    </section>
  );
}
