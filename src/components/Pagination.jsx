export default function Pagination({ page, pages, total, perPage, onChange, itemLabel = 'article' }) {
  if (!pages || pages < 1) return null;

  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const numbers = [];
  const max = 5;
  let start = Math.max(1, page - 2);
  let end = Math.min(pages, start + max - 1);
  start = Math.max(1, end - max + 1);
  for (let i = start; i <= end; i++) numbers.push(i);

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-info">
        {from}–{to} sur {total} {itemLabel}{total > 1 ? 's' : ''}
      </span>
      <div className="pagination-controls">
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(1)} disabled={page <= 1} aria-label="Première page">
          «
        </button>
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Page précédente">
          ‹
        </button>
        {start > 1 && <span className="pagination-gap">…</span>}
        {numbers.map((n, idx) => (
          <button
            key={n}
            type="button"
            className={`btn btn-sm ${n === page ? 'btn-or' : 'btn-contour'}`}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            {n}
          </button>
        ))}
        {end < pages && <span className="pagination-gap">…</span>}
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Page suivante">
          ›
        </button>
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(pages)} disabled={page >= pages} aria-label="Dernière page">
          »
        </button>
      </div>
    </nav>
  );
}