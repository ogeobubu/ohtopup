import type { ReactNode } from "react";

type Props = {
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  loadingLabel?: string;
  errorLabel?: string;
  emptyLabel?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export default function QueryState({ loading, error, empty, loadingLabel = "Loading…", errorLabel = "This information couldn’t be loaded.", emptyLabel = "Nothing to show yet.", onRetry, children }: Props) {
  if (loading) return <div className="rounded-lg border border-line bg-paper p-10 text-center text-xs text-muted" role="status"><span className="mx-auto mb-3 block h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />{loadingLabel}</div>;
  if (error) return <div className="rounded-lg border border-line bg-paper p-10 text-center" role="alert"><p className="text-xs text-muted">{errorLabel}</p>{onRetry && <button className="mt-4 min-h-10 rounded-md bg-accent px-4 text-xs font-semibold text-white" onClick={onRetry}>Try again</button>}</div>;
  if (empty) return <div className="rounded-lg border border-line bg-paper p-10 text-center text-xs text-muted">{emptyLabel}</div>;
  return children;
}
