import { useState } from "react";
import { format, isToday, isYesterday } from "date-fns";
import callbackApi, { tellCallbacksChanged } from "../callback.api";
import { telHref } from "../../../shared/lib/format";

const BEST_TIME = { any: "Any time", morning: "Morning", afternoon: "Afternoon" };

const sent = (v) => {
  const d = new Date(v);
  if (isToday(d)) return `Today ${format(d, "HH:mm")}`;
  if (isYesterday(d)) return `Yesterday ${format(d, "HH:mm")}`;
  return format(d, "d MMM, HH:mm");
};

// One table for the Dashboard and the Call-backs page. "Mark as called" updates the row in place.
export default function CallbackTable({ rows, onChanged, empty = "No call-back requests." }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  async function markCalled(id) {
    setBusy(id);
    setError(null);
    try {
      await callbackApi.markCalled(id);
      tellCallbacksChanged();
      onChanged?.();
    } catch (e) {
      setError(e.message);
      if (e.httpStatus === 409) onChanged?.(); // someone else called them: show the new state
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {error && <div className="alert alert-danger mx-3" role="alert">{error}</div>}
      <div className="table-responsive">
        <table className="table align-middle mb-0 callback-table">
          <thead>
            <tr><th>Customer</th><th>Car and service</th><th className="d-none d-lg-table-cell">Their message</th><th>Sent</th><th><span className="visually-hidden">Action</span></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.callback_id}>
                <td>
                  <div className="fw-semibold">{r.full_name}</div>
                  <div className="muted small text-nowrap">{r.phone}</div>
                  <div className="muted small">Best time: {BEST_TIME[r.best_time] || "Any time"}</div>
                </td>
                <td>
                  <div className="fw-semibold">{r.car || "Car not given"}</div>
                  <div className="muted small">{r.service_name || "Not sure"}</div>
                </td>
                <td className="d-none d-lg-table-cell" style={{ maxWidth: 320 }}><span className="muted small">{r.problem || "–"}</span></td>
                <td>
                  <span className="small text-nowrap">{sent(r.created_at)}</span>
                  <div className="mt-1">
                    {r.status === 0
                      ? <span className="ag-badge ag-badge--new">New</span>
                      : <span className="ag-badge ag-badge--5" title={r.called_at ? `Called ${sent(r.called_at)}` : undefined}>Called{r.called_by_name ? ` by ${r.called_by_name.split(" ")[0]}` : ""}</span>}
                  </div>
                  <div className="muted small d-lg-none mt-1">{r.problem}</div>
                </td>
                <td className="text-end">
                  <div className="d-flex gap-2 justify-content-end flex-wrap">
                    <a href={telHref(r.phone)} className="btn btn-sm btn-outline-secondary">Call</a>
                    {r.status === 0 && (
                      <button type="button" className="btn btn-sm btn-ink" disabled={busy === r.callback_id} onClick={() => markCalled(r.callback_id)}>
                        {busy === r.callback_id ? "Saving…" : "Mark as called"}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan="5" className="muted">{empty}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
