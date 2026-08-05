type LoadingStateProps = Readonly<{
  message?: string;
}>;

export function LoadingState({
  message = 'Preparing a calm space for you…',
}: LoadingStateProps) {
  return (
    <div
      className="border-clinic-border bg-clinic-surface flex max-w-xl items-center gap-4 rounded-clinic border p-6"
      role="status"
    >
      <span
        aria-hidden="true"
        className="border-clinic-border border-t-clinic-brand size-6 shrink-0 animate-spin rounded-full border-4 motion-reduce:animate-none"
      />
      <p className="text-clinic-muted font-medium">{message}</p>
    </div>
  );
}
