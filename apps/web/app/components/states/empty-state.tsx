import type { ReactNode } from 'react';

type EmptyStateProps = Readonly<{
  title: string;
  message: string;
  action?: ReactNode;
}>;

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <section className="border-clinic-border bg-clinic-surface shadow-clinic mt-10 max-w-2xl rounded-clinic border p-6 sm:p-8">
      <h2 className="text-clinic-ink text-xl font-bold">{title}</h2>
      <p className="text-clinic-muted mt-3 leading-7">{message}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </section>
  );
}
