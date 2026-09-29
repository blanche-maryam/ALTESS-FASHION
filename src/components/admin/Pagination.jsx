export default function Pagination({ page, pages, total, perPage, onChange, itemLabel = 'élément' }) {
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
    <div className="pagination">
      <span className="pagination-info">
        {from}–{to} sur {total} {itemLabel}{total > 1 ? 's' : ''}
      </span>
      <div className="pagination-controls">
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(1)} disabled={page <= 1}>
          «
        </button>
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1}>
          ‹
        </button>
        {start > 1 && <span className="pagination-gap">…</span>}
        {numbers.map((n) => (
          <button
            key={n}
            type="button"
            className={`btn btn-sm ${n === page ? 'btn-or' : 'btn-contour'}`}
            onClick={() => onChange(n)}
            aria-current={n === page ? 'page' : undefined}
          >
            {n}
          </button>
        ))}
        {end < pages && <span className="pagination-gap">…</span>}
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(page + 1)} disabled={page >= pages}>
          ›
        </button>
        <button type="button" className="btn btn-contour btn-sm" onClick={() => onChange(pages)} disabled={page >= pages}>
          »
        </button>
      </div>
    </div>
  );
}
