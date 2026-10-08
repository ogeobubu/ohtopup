export default function PageLoader() {
  return <div className="grid min-h-[55vh] place-items-center" role="status" aria-live="polite">
    <div className="text-center"><span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-[3px] border-line border-t-accent" /><span className="text-xs text-muted">Loading page…</span></div>
  </div>;
}
