export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

export function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div className="notice">
      <span>i</span>
      <p>{children}</p>
    </div>
  );
}
