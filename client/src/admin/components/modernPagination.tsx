type Props = { currentPage: number; totalPages: number; onPageChange: (page: number) => void };
export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;
  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  return <nav className="ot-admin-pagination" aria-label="Pagination"><span>Page {currentPage} of {totalPages}</span><div>
    <button disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>Previous</button>
    {pages.map(page => <button className="ot-admin-page-number" key={page} aria-label={`Page ${page}`} aria-current={page === currentPage ? 'page' : undefined} onClick={() => onPageChange(page)}>{page}</button>)}
    <button disabled={currentPage >= totalPages} onClick={() => onPageChange(currentPage + 1)}>Next</button>
  </div></nav>;
}
