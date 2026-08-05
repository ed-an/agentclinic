'use client';

type ErrorStateProps = Readonly<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}>;

export function ErrorState({
  title = 'Something interrupted your care',
  message = 'Please try again. If the problem continues, take a short rest and return later.',
  onRetry,
}: ErrorStateProps) {
  return (
    <section
      className="border-clinic-danger/30 bg-clinic-surface max-w-2xl rounded-clinic border p-6 sm:p-8"
      role="alert"
    >
      <h2 className="text-clinic-danger text-xl font-bold">{title}</h2>
      <p className="text-clinic-muted mt-3 leading-7">{message}</p>
      {onRetry ? (
        <button
          className="bg-clinic-brand hover:bg-clinic-brand-strong mt-6 min-h-11 rounded-full px-5 py-2 font-semibold text-white"
          onClick={onRetry}
          type="button"
        >
          Try again
        </button>
      ) : null}
    </section>
  );
}
