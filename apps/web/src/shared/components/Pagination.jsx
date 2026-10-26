export default function Pagination({ page, pages, total, onChange }) {
  if (!total) return null;
  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
      <span className="text-muted small">
        Page {page} of {pages} · {total} {total === 1 ? "record" : "records"}
      </span>
      <div className="btn-group">
        <button type="button" className="btn btn-outline-secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </button>
        <button type="button" className="btn btn-outline-secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
