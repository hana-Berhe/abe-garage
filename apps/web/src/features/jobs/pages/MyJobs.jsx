import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import orderService from "../../orders/order.api";
import Alert from "../../../shared/components/Alert";
import { useAuth } from "../../auth/AuthContext";
import { time } from "../../../shared/lib/format";

// FR-TEC-02..07: phone-first list of my jobs with big Start and Mark done buttons.
export default function MyJobs() {
  const { employee } = useAuth();
  const [jobs, setJobs] = useState(null);
  const [tab, setTab] = useState("todo");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  const [noteFor, setNoteFor] = useState(null);
  const [note, setNote] = useState("");

  const load = useCallback(() => orderService.myJobs().then(setJobs).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function change(job, status) {
    setBusy(job.line_id);
    setError(null);
    try {
      await orderService.setLineStatus(job.line_id, status);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function saveNote(job) {
    setBusy(job.line_id);
    try {
      await orderService.saveLineNote(job.line_id, note);
      setNoteFor(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  }

  const todo = (jobs || []).filter((j) => j.line_status < 2);
  const done = (jobs || []).filter((j) => j.line_status === 2);
  const shown = tab === "todo" ? todo : done;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="page-title mb-1">My jobs</h1>
      <p className="muted">{format(new Date(), "EEEE d MMM")} · {employee.name}</p>
      <div className="btn-group w-100 mb-3" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "todo"} className={`btn ${tab === "todo" ? "btn-ink" : "btn-outline-secondary"}`} onClick={() => setTab("todo")}>To do ({todo.length})</button>
        <button type="button" role="tab" aria-selected={tab === "done"} className={`btn ${tab === "done" ? "btn-ink" : "btn-outline-secondary"}`} onClick={() => setTab("done")}>Done today ({done.length})</button>
      </div>
      <Alert>{error}</Alert>
      {jobs && shown.length === 0 && <p className="muted">{tab === "todo" ? "No jobs waiting for you." : "Nothing finished yet today."}</p>}
      {shown.map((j) => {
        const waiting = j.order_status === 1;
        return (
          <div key={j.line_id} className="ag-card mb-3" style={j.line_status === 1 ? { borderColor: "var(--ag-s3-fg)", borderWidth: 2 } : undefined}>
            <div className="d-flex justify-content-between small mb-1">
              <span className="fw-semibold" style={{ color: j.line_status === 1 ? "var(--ag-s3-fg)" : j.line_status === 2 ? "var(--ag-s4-fg)" : "var(--ag-muted)" }}>
                {j.line_status === 0 && "Not started"}
                {j.line_status === 1 && `Started ${time(j.started_at)}`}
                {j.line_status === 2 && `Done ${time(j.done_at)}`}
              </span>
              <Link to={`/admin/order/${j.order_id}`} className="muted">Order {j.order_id}</Link>
            </div>
            <h2 className="h3 mb-0">{j.name}</h2>
            {j.labor_hours && <p className="muted mb-2">About {Number(j.labor_hours)} h</p>}
            {waiting && <span className="ag-badge ag-badge--1 mb-2">Waiting for customer</span>}
            <div className="d-flex justify-content-between align-items-center p-3 my-2" style={{ background: "var(--ag-surface-alt)", borderRadius: 8 }}>
              <div><div className="fw-semibold">{j.year} {j.make} {j.model}</div><div className="muted small">{j.color}</div></div>
              <span className="plate">{j.plate}</span>
            </div>
            {j.internal_notes && <p className="small mb-2"><strong>Desk note:</strong> {j.internal_notes}</p>}
            {j.technician_note && <p className="small mb-2"><strong>My note:</strong> {j.technician_note}</p>}
            {j.line_status === 0 && (
              <button type="button" className="btn btn-ink btn-xl w-100" disabled={busy === j.line_id || waiting} onClick={() => change(j, 1)}>Start job</button>
            )}
            {j.line_status === 1 && (
              <button type="button" className="btn btn-xl w-100 text-white" style={{ background: "var(--ag-s4-fg)" }} disabled={busy === j.line_id} onClick={() => change(j, 2)}>✓ Mark job done</button>
            )}
            {noteFor === j.line_id ? (
              <div className="mt-2">
                <label htmlFor={`note-${j.line_id}`} className="form-label">Work note (the desk sees it)</label>
                <textarea id={`note-${j.line_id}`} className="form-control mb-2" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-brand flex-grow-1" disabled={busy === j.line_id} onClick={() => saveNote(j)}>Save note</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setNoteFor(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={() => { setNoteFor(j.line_id); setNote(j.technician_note || ""); }}>
                {j.technician_note ? "Edit work note" : "Add a work note or extra work found"}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
