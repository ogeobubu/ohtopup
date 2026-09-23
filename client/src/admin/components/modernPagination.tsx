type Props = { currentPage: number; totalPages: number; onPageChange: (page: number) => void };

const btn =
  "min-w-[34px] min-h-[44px] px-[11px] py-2 border border-line bg-paper text-muted text-[11px] transition hover:bg-bg disabled:opacity-45 disabled:cursor-not-allowed";
const active =
  "min-w-[34px] min-h-[44px] px-[11px] py-2 border border-accent bg-tint text-accent text-[11px] transition";

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-0 py-5 text-[11px] text-muted"
      aria-label="Pagination"
    >
      <span>
        Page {currentPage} of {totalPages}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button className={btn} disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          Previous
        </button>
        {pages.map((page) => (
          <button
            className={page === currentPage ? active : btn}
            key={page}
            aria-label={`Page ${page}`}
            aria-current={page === currentPage ? "page" : undefined}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button className={btn} disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}
