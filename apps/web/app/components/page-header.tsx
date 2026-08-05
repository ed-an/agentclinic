type PageHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  introduction: string;
}>;

export function PageHeader({ eyebrow, title, introduction }: PageHeaderProps) {
  return (
    <div className="max-w-2xl">
      {eyebrow ? (
        <p className="text-clinic-brand mb-3 text-sm font-bold tracking-widest uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-clinic-ink text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="text-clinic-muted mt-5 text-lg leading-8">{introduction}</p>
    </div>
  );
}
