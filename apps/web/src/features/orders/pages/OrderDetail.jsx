import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import orderService, { invoiceApi } from "../order.api";
import employeeService from "../../employees/employee.api";
import serviceService from "../../services/service.api";
import Alert from "../../../shared/components/Alert";
import Field from "../../../shared/components/Field";
import Totals from "../../../shared/components/Totals";
import { LineStatusBadge, PaidBadge, StatusBadge } from "../../../shared/components/StatusBadge";
import { useAuth } from "../../auth/AuthContext";
import { OFFICE } from "../../../shared/constants/roles";
import { date, dateTime, initials, money, time } from "../../../shared/lib/format";

const STEPS = [
  [1, "Awaiting approval"],
  [2, "Approved"],
  [3, "In progress"],
  [4, "Completed"],
];

const ACTIONS = {
  created: "Order created",
  edited: "Order edited",
  job_added: "Extra job added",
  approved: "Approved",
  declined: "Declined",
  technician_assigned: "Technician assigned",
  job_started: "Job started",
  job_done: "Job done",
  completed: "All jobs done",
  email_sent: "Email sent",
  email_failed: "Email failed",
  paid: "Paid in cash",
};

export function statusLink(hash) {
  return `${window.location.origin}/order-status/${hash}`;
}

// FR-ORD-06, FR-EST-02..05, FR-TEC-01, FR-TRK-04.
export default function OrderDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { employee } = useAuth();
  const office = OFFICE.includes(employee.role);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(
    location.state?.created && location.state.emailSent ? "Order created. The status link was emailed to the customer." : null
  );
  const emailFailed = location.state?.created && !location.state.emailSent;
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);
  const [approval, setApproval] = useState(null); // { decision, method, note }
  const [adding, setAdding] = useState(null);
  const [notes, setNotes] = useState(null);
  const [editLine, setEditLine] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => orderService.get(id).then(setOrder).catch(setError), [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!office) return;
    employeeService.technicians().then((d) => setTechnicians(d.rows)).catch(() => {});
    serviceService.list().then((all) => setServices(all.filter((s) => s.active))).catch(() => {});
  }, [office]);

  // Runs one change, shows the server's message on failure, and keeps the fresh order.
  async function act(fn, done) {
    setBusy(true);
    setError(null);
    try {
      const fresh = await fn();
      if (fresh && fresh.order_id) setOrder(fresh);
      if (done) done();
      return true;
    } catch (err) {
      setError(err);
      return false;
    } finally {
      setBusy(false);
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(statusLink(order.order_hash));
      setNotice("Status link copied.");
    } catch {
      window.prompt("Copy the status link:", statusLink(order.order_hash));
    }
  };

  // FR-ORD-07: resend the not-started lines with one changed or removed; the server reprices and keeps started ones.
  const saveLines = (lineId, remove) => {
    const lines = order.lines
      .filter((l) => l.line_status === 0 && !(remove && l.line_id === lineId))
      .map((l) => {
        const price = l.line_id === lineId ? editLine.price : l.line_price;
        return l.service_id ? { service_id: l.service_id, price } : { description: l.description, price };
      });
    return act(() => orderService.update(id, {
      lines,
      updated_at: order.updated_at,
      estimated_ready_date: order.estimated_ready_date ? String(order.estimated_ready_date).slice(0, 10) : "",
      notes_for_customer: order.notes_for_customer || "",
      internal_notes: order.internal_notes || "",
    }), () => setEditLine(null));
  };

  if (!order) return <Alert>{error?.message}</Alert>;
  const awaiting = order.status === 1;
  const closed = order.status === 4 || order.status === 5;
  const approvals = order.history.filter((h) => h.action === "approved");
  const reapproval = awaiting && approvals.length > 0;
  const editableLines = awaiting && office;

  return (
    <>
      <p className="muted small mb-2 no-print"><Link to="/admin/orders">Orders</Link> / Order {order.order_id}</p>
      <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
        <h1 className="page-title mb-0">Order {order.order_id}</h1>
        <StatusBadge status={order.status} />
        {order.status === 4 && <PaidBadge paid={order.paid} />}
      </div>
      <p className="muted">
        Opened {dateTime(order.created_at)} by {order.created_by_name}
        {order.estimated_ready_date && <> · Ready by {date(order.estimated_ready_date)}</>}
      </p>
      <Alert kind="success">{notice}</Alert>
      <Alert kind="warning">{emailFailed ? "Order created, but the email could not be sent. Use Copy status link and send it another way." : null}</Alert>
      <Alert>{error?.message}</Alert>

      <div className="d-flex gap-2 flex-wrap mb-4 no-print">
        <button type="button" className="btn btn-outline-secondary" onClick={copyLink}>Copy status link</button>
        {office && order.status !== 5 && (
          <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={async () => {
            setBusy(true);
            try {
              const r = await invoiceApi.resendEmail(id);
              if (r.sent) setNotice("Email sent to the customer."); else setError({ message: "The email could not be sent. Use Copy status link instead." });
              load();
            } catch (e) { setError(e); } finally { setBusy(false); }
          }}>Resend email</button>
        )}
        {office && <Link to={`/admin/order/${id}/estimate`} className="btn btn-outline-secondary">Print estimate</Link>}
        {office && order.status === 4 && <Link to={`/admin/order/${id}/invoice`} className="btn btn-brand">{order.paid ? "Invoice" : "Invoice and payment"}</Link>}
      </div>

      {order.status !== 5 ? (
        <div className="ag-card mb-4">
          <div className="row g-2">
            {STEPS.map(([code, label]) => {
              const reached = order.status >= code;
              const current = order.status === code;
              return (
                <div className="col-6 col-md-3" key={code}>
                  <div style={{ height: 4, borderRadius: 2, background: current ? "var(--ag-s3-fg)" : reached ? "var(--ag-s4-fg)" : "var(--ag-line)" }} />
                  <div className={`mt-2 small ${current ? "fw-bold" : reached ? "fw-semibold" : "muted"}`}>{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Alert kind="secondary">The customer declined this estimate. No work or invoice is possible. A returning customer gets a new order.</Alert>
      )}

      {awaiting && office && (
        <div className="ag-card mb-4" style={{ borderColor: "var(--ag-s1-fg)" }}>
          <h2 className="h4">{reapproval ? "Extra work needs the customer's yes" : "Waiting for the customer's answer"}</h2>
          <p className="mb-3">Call or show the customer the estimate of <strong>{money(order.total)}</strong> (VAT included), then record their answer.</p>
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-brand" onClick={() => setApproval({ decision: "approve", method: "phone", note: "" })}>Record approval</button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setApproval({ decision: "decline", method: "phone", note: "" })}>Record decline</button>
          </div>
        </div>
      )}

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="ag-card">
            <div className="card-title-row">
              <div>
                <h2>Job card</h2>
                <p className="muted small mb-0">One technician per job. Prices were copied when the order was made.</p>
              </div>
              {office && !closed && (
                <button type="button" className="btn btn-outline-secondary" onClick={() => setAdding({ kind: "service", service_id: "", description: "", price: "" })}>
                  + Add job or part
                </button>
              )}
            </div>
            <div className="table-responsive">
              <table className="table align-middle">
                <thead><tr><th>Job</th><th>Technician</th><th>Progress</th><th className="text-end">Price</th></tr></thead>
                <tbody>
                  {order.lines.map((l) => (
                    <tr key={l.line_id}>
                      <td>
                        <div className="fw-semibold">{l.name}</div>
                        <div className="muted small">{l.service_id ? `Service${l.labor_hours ? ` · about ${Number(l.labor_hours)} h` : ""}` : "Extra item"}</div>
                        {l.technician_note && <div className="small mt-1"><strong>Note:</strong> {l.technician_note}</div>}
                      </td>
                      <td style={{ minWidth: 170 }}>
                        {office && !closed && l.line_status === 0 ? (
                          <select className="form-select" aria-label={`Technician for ${l.name}`} value={l.technician_id || ""} disabled={busy}
                            onChange={(e) => act(() => orderService.assignTechnician(l.line_id, e.target.value ? Number(e.target.value) : null))}>
                            <option value="">Not assigned</option>
                            {l.technician_id && !technicians.some((t) => t.employee_id === l.technician_id) && <option value={l.technician_id}>{l.technician_name}</option>}
                            {technicians.map((t) => <option key={t.employee_id} value={t.employee_id}>{t.first_name} {t.last_name}</option>)}
                          </select>
                        ) : (
                          l.technician_name || <span className="muted">Not assigned</span>
                        )}
                      </td>
                      <td>
                        <LineStatusBadge status={l.line_status} />
                        <div className="muted small">{l.line_status === 2 ? `Done ${time(l.done_at)}` : l.line_status === 1 ? `Started ${time(l.started_at)}` : ""}</div>
                        {office && l.technician_id && (order.status === 2 || order.status === 3) && l.line_status === 0 && (
                          <button type="button" className="btn btn-sm btn-outline-secondary mt-1" disabled={busy} onClick={() => act(() => orderService.setLineStatus(l.line_id, 1))}>Start</button>
                        )}
                        {office && l.line_status === 1 && (
                          <button type="button" className="btn btn-sm btn-outline-secondary mt-1" disabled={busy} onClick={() => act(() => orderService.setLineStatus(l.line_id, 2))}>Mark done</button>
                        )}
                      </td>
                      <td className="text-end money">
                        {money(l.line_price)}
                        {editableLines && l.line_status === 0 && (
                          <div><button type="button" className="btn btn-link btn-sm p-0" onClick={() => setEditLine({ line_id: l.line_id, name: l.name, price: l.line_price })}>Change</button></div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {editableLines && <p className="muted small">While the order is Awaiting approval you can change a price or remove a job that hasn't started.</p>}
            <Totals subtotal={order.subtotal} vatRate={order.vat_rate} vatAmount={order.vat_amount} total={order.total} />
          </div>

          {approvals.map((h) => (
            <div key={h.history_id} className="ag-card" style={{ background: "#F1F9F5", borderColor: "#BFE3D2" }}>
              <strong>Customer approved {h.details}</strong>
              <div className="muted small">{dateTime(h.created_at)} · recorded by {h.employee_name}</div>
            </div>
          ))}
          {order.status === 4 && order.paid ? (
            <div className="ag-card" style={{ background: "#F1F9F5", borderColor: "#BFE3D2" }}>
              <strong>Paid in cash on {dateTime(order.paid_at)}</strong>
              <div className="muted small">Received by {order.paid_received_by_name}</div>
            </div>
          ) : null}

          <div className="row g-3 mt-1">
            <div className="col-md-6">
              <div className="ag-card h-100">
                <h2 className="h5">Note for the customer</h2>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{order.notes_for_customer || <span className="muted">None</span>}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="ag-card h-100">
                <h2 className="h5">Internal note <span className="muted text-lowercase fw-normal">(staff only)</span></h2>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{order.internal_notes || <span className="muted">None</span>}</p>
              </div>
            </div>
          </div>
          {office && order.status !== 5 && (
            <button type="button" className="btn btn-outline-secondary mt-3" onClick={() => setNotes({
              estimated_ready_date: order.estimated_ready_date ? String(order.estimated_ready_date).slice(0, 10) : "",
              notes_for_customer: order.notes_for_customer || "", internal_notes: order.internal_notes || "",
            })}>Edit notes and date</button>
          )}
        </div>

        <div className="col-lg-4">
          <div className="ag-card">
            <h2 className="h5">Customer and car</h2>
            <div className="d-flex gap-3 align-items-center mb-3">
              <span className="rounded-circle d-inline-grid text-white fw-bold" style={{ width: 44, height: 44, placeItems: "center", background: "var(--ag-navy-900)" }}>{initials(order.first_name, order.last_name)}</span>
              <div>
                <Link to={`/admin/customer/${order.customer_id}`}>{order.first_name} {order.last_name}</Link>
                <div className="muted small">{order.phone}</div>
              </div>
            </div>
            <hr />
            <div className="d-flex justify-content-between gap-2">
              <div>
                <Link to={`/admin/vehicle/${order.vehicle_id}`} className="fw-semibold">{order.year} {order.make} {order.model}</Link>
                <div className="muted small">{[order.color, order.mileage != null ? `${order.mileage.toLocaleString()} km` : null].filter(Boolean).join(" · ")}</div>
              </div>
              <span className="plate align-self-start">{order.plate}</span>
            </div>
            <a href={`tel:${order.phone}`} className="btn btn-outline-secondary w-100 mt-3">Call {order.first_name}</a>
          </div>
          <div className="ag-card">
            <h2 className="h5">History</h2>
            <ul className="list-unstyled mb-0">
              {order.history.map((h) => (
                <li key={h.history_id} className="mb-2">
                  <div className="fw-semibold small">{ACTIONS[h.action] || h.action}</div>
                  <div className="muted small">{dateTime(h.created_at)} · {h.employee_name || "System"}{h.details ? ` · ${h.details}` : ""}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Modal show={!!approval} onHide={() => setApproval(null)} centered>
        {approval && (
          <>
            <Modal.Header closeButton><Modal.Title>{approval.decision === "approve" ? "Record approval" : "Record decline"}</Modal.Title></Modal.Header>
            <Modal.Body>
              <p>The customer {approval.decision === "approve" ? "said yes to" : "said no to"} <strong>{money(order.total)}</strong>.</p>
              <fieldset className="mb-3">
                <legend className="form-label">How did they answer?</legend>
                {[["phone", "By phone"], ["in_person", "In person"]].map(([v, l]) => (
                  <div className="form-check" key={v}>
                    <input id={`m-${v}`} type="radio" className="form-check-input" name="method" checked={approval.method === v} onChange={() => setApproval({ ...approval, method: v })} />
                    <label htmlFor={`m-${v}`} className="form-check-label">{l}</label>
                  </div>
                ))}
              </fieldset>
              <Field label="Note (optional)" name="approval_note" value={approval.note} maxLength={150} onChange={(e) => setApproval({ ...approval, note: e.target.value })} />
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setApproval(null)}>Cancel</button>
              <button type="button" className="btn btn-brand" disabled={busy}
                onClick={() => act(() => (approval.decision === "approve" ? orderService.approve : orderService.decline)(id, approval.method, approval.note || undefined), () => setApproval(null))}>
                {approval.decision === "approve" ? "Save approval" : "Save decline"}
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <Modal show={!!adding} onHide={() => setAdding(null)} centered>
        {adding && (
          <>
            <Modal.Header closeButton><Modal.Title>Add a job or part</Modal.Title></Modal.Header>
            <Modal.Body>
              {!awaiting && <Alert kind="warning">Adding a job sends the order back to Awaiting approval. Jobs already started can still be finished.</Alert>}
              <div className="btn-group mb-3" role="group">
                <button type="button" className={`btn ${adding.kind === "service" ? "btn-dark-navy" : "btn-outline-secondary"}`} onClick={() => setAdding({ ...adding, kind: "service" })}>Service</button>
                <button type="button" className={`btn ${adding.kind === "extra" ? "btn-dark-navy" : "btn-outline-secondary"}`} onClick={() => setAdding({ ...adding, kind: "extra" })}>Extra item</button>
              </div>
              {adding.kind === "service" ? (
                <Field label="Service" name="service_id" as="select" value={adding.service_id} onChange={(e) => setAdding({ ...adding, service_id: e.target.value })}
                  error={error?.field?.endsWith("service_id") ? error.message : null}>
                  <option value="">Choose…</option>
                  {services.filter((s) => !order.lines.some((l) => l.service_id === s.service_id)).map((s) => (
                    <option key={s.service_id} value={s.service_id}>{s.name} · {money(s.price)}</option>
                  ))}
                </Field>
              ) : (
                <Field label="Description" name="description" value={adding.description} onChange={(e) => setAdding({ ...adding, description: e.target.value })}
                  error={error?.field === "description" ? error.message : null} />
              )}
              <Field label={adding.kind === "service" ? "Custom price (optional)" : "Price before VAT"} name="price" type="number" step="0.01" min="0"
                value={adding.price} onChange={(e) => setAdding({ ...adding, price: e.target.value })} error={error?.field === "price" ? error.message : null} />
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setAdding(null)}>Cancel</button>
              <button type="button" className="btn btn-brand" disabled={busy}
                onClick={() => act(() => orderService.addLine(id, adding.kind === "service"
                  ? { service_id: Number(adding.service_id) || undefined, price: adding.price || undefined }
                  : { description: adding.description, price: adding.price }), () => setAdding(null))}>
                Add
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <Modal show={!!editLine} onHide={() => setEditLine(null)} centered>
        {editLine && (
          <>
            <Modal.Header closeButton><Modal.Title>{editLine.name}</Modal.Title></Modal.Header>
            <Modal.Body>
              <Field label="Price before VAT" name="line_price" type="number" step="0.01" min="0" value={editLine.price}
                onChange={(e) => setEditLine({ ...editLine, price: e.target.value })} />
            </Modal.Body>
            <Modal.Footer className="justify-content-between">
              <button type="button" className="btn btn-outline-secondary" disabled={busy || order.lines.length < 2} onClick={() => saveLines(editLine.line_id, true)}>Remove job</button>
              <button type="button" className="btn btn-brand" disabled={busy} onClick={() => saveLines(editLine.line_id, false)}>Save price</button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      <Modal show={!!notes} onHide={() => setNotes(null)} centered>
        {notes && (
          <>
            <Modal.Header closeButton><Modal.Title>Notes and date</Modal.Title></Modal.Header>
            <Modal.Body>
              <Field label="Estimated ready date" name="estimated_ready_date" type="date" value={notes.estimated_ready_date} onChange={(e) => setNotes({ ...notes, estimated_ready_date: e.target.value })} />
              <Field label="Note for the customer" name="notes_for_customer" as="textarea" rows={3} value={notes.notes_for_customer} onChange={(e) => setNotes({ ...notes, notes_for_customer: e.target.value })} />
              <Field label="Internal note (staff only)" name="internal_notes" as="textarea" rows={3} value={notes.internal_notes} onChange={(e) => setNotes({ ...notes, internal_notes: e.target.value })} />
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setNotes(null)}>Cancel</button>
              <button type="button" className="btn btn-brand" disabled={busy}
                onClick={() => act(() => orderService.update(id, { ...notes, updated_at: order.updated_at }), () => setNotes(null))}>Save</button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}
