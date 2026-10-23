import type { ReactNode } from 'react';

export default function InlinePurchasePanel({ title, step, total, children }: {
  title: string;
  step?: number;
  total?: number;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-line bg-paper" aria-label={title}>
      <header className="border-b border-line px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {step && total && <span className="text-xs text-muted">Step {step} of {total}</span>}
        </div>
        {step && total && <div role="progressbar" aria-label="Purchase steps" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} className="mt-3 h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent transition-[width] duration-200 motion-reduce:transition-none" style={{ width: `${step / total * 100}%` }} /></div>}
      </header>
      <div className="min-w-0 p-3 sm:p-5">{children}</div>
    </section>
  );
}
