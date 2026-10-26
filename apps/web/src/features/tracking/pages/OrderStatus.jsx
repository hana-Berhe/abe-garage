import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import trackingApi from "../tracking.api";
import { Brand } from "../../../layouts/Header";
import Icon from "../../../shared/components/Icon";
import { StatusBadge, PaidBadge } from "../../../shared/components/StatusBadge";
import { telHref } from "../../../shared/lib/format";

const JOB_STATE = { 0: "Not started", 1: "Working on it", 2: "Done" };

const when = (v) => (v ? format(new Date(v), "EEE d MMM, HH:mm") : "");
const day = (v) => (v ? format(new Date(v), "EEEE d MMMM") : "");

function headline(order) {
  if (order.status === 1) return "We have checked your car";
  if (order.status === 2) return "Your car is in the queue";
  if (order.status === 3) return "Your car is being repaired";
  if (order.status === 4) return order.paid ? "All done. Thank you!" : "Your car is ready to collect";
  return "You said no to this work";
}

// Each step is "done", "now" or "todo".
function timeline(order) {
  const jobsDone = order.lines.filter((l) => l.line_status === 2).length;
  const how = order.answer_method ? `, ${order.answer_method}` : "";
  const steps = [{ state: "done", title: "Car checked", note: when(order.created_at) }];
  if (order.status === 5) {
    steps.push({ state: "done", title: `You said no${how}`, note: when(order.answered_at) });
    steps.push({ state: "todo", title: "No work was done", note: "Call us if you change your mind" });
    return steps;
  }
  steps.push(order.status === 1
    ? { state: "now", title: "Waiting for your yes", note: "We will call you to go over the work and the price" }
    : { state: "done", title: `You said yes${how}`, note: when(order.answered_at) });
  steps.push({
    state: order.status === 4 ? "done" : order.status === 3 ? "now" : "todo",
    title: "Being repaired",
    note: order.status >= 3 ? `${jobsDone} of ${order.lines.length} jobs done` : "Starts after your yes",
  });
  steps.push(order.status === 4
    ? { state: "done", title: "Ready to collect", note: order.paid ? `Paid ${when(order.paid_at)}` : when(order.completed_at) }
    : { state: "todo", title: "Ready to collect", note: "We will email you" });
  return steps;
}

function StatusShell({ phone, children }) {
  return (
    <div className="status-shell">
      <header className="status-bar">
        <div className="status-bar__inner">
          <Brand small tagline={false} />
          {phone && <a href={telHref(phone)} className="status-call"><Icon name="phone" size={18} />Call us</a>}
        </div>
      </header>
      <main className="status-main">{children}</main>
    </div>
  );
}

// FR-TRK-02, FR-TRK-03, FR-TRK-08: the customer's private status page. No login.
// Progress only: prices are shown to signed-in staff only, and the desk tells the customer by phone or in person.
export default function OrderStatus() {
  const { hash } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { trackingApi.orderStatus(hash).then(setOrder).catch((e) => setError(e)); }, [hash]);

  if (error) {
    return (
      <StatusShell>
        <h1 className="d">Order not found</h1>
        <p>{error.httpStatus === 404 ? error.message : "We couldn't load your order right now. Please try again later."}</p>
      </StatusShell>
    );
  }
  if (!order) return <StatusShell><p className="text-muted">Loading…</p></StatusShell>;

  return (
    <StatusShell phone={order.garage_phone}>
      <p className="text-muted mb-0">Hello {order.first_name},</p>
      <h1 className="d">{headline(order)}</h1>

      <section className="ag-card mb-3">
        <div className="d-flex justify-content-between align-items-start gap-2 flex-wrap">
          <div className="status-car">
            <span className="status-car__icon"><Icon name="car" size={28} /></span>
            <div>
              <strong className="d-block fs-5">{order.year} {order.make} {order.model}</strong>
              <span className="text-muted"><span className="mono">{order.plate}</span> · Order {order.order_id}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            <StatusBadge status={order.status} />
            {order.status === 4 && <PaidBadge paid={order.paid} />}
          </div>
        </div>
        {order.estimated_ready_date && order.status < 4 ? (
          <div className="status-ready"><span>Expected ready</span><strong>{day(order.estimated_ready_date)}</strong></div>
        ) : <div className="mb-4" />}
        <ol className="timeline">
          {timeline(order).map((s) => (
            <li key={s.title} className={s.state}>
              <span className="timeline__dot">
                {s.state === "done" && <Icon name="check" size={16} stroke={3} />}
                {s.state === "now" && <Icon name="wrench" size={15} />}
              </span>
              <div><strong>{s.title}</strong><small>{s.note}</small></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="ag-card mb-3">
        <h2 className="h4">The work on your car</h2>
        <table className="table align-middle mb-2">
          <tbody>
            {order.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td className="text-end"><span className={`job-state job-state--${l.line_status}`}>{l.line_status === 2 && <Icon name="check" size={16} stroke={3} />}{JOB_STATE[l.line_status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {order.status !== 5 && <p className="text-muted small mt-3 mb-0">The desk tells you the price before any work starts. You pay in cash when you collect the car.</p>}
      </section>

      {order.notes_for_customer && (
        <div className="note-box mb-3">
          <Icon name="message" size={22} />
          <div><strong className="d-block">Message from the garage</strong>{order.notes_for_customer}</div>
        </div>
      )}

      <div className="d-flex flex-wrap gap-2">
        {order.garage_phone && (
          <a href={telHref(order.garage_phone)} className="btn btn-brand btn-xl flex-fill d-inline-flex align-items-center justify-content-center gap-2"><Icon name="phone" size={18} />Call {order.garage_phone}</a>
        )}
        {order.garage_address && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.garage_address)}`} target="_blank" rel="noreferrer"
            className="btn btn-outline-secondary btn-xl flex-fill d-inline-flex align-items-center justify-content-center">How to find us</a>
        )}
      </div>
      <p className="text-center text-muted small mt-3">This page is private to you. Please do not share the link.</p>
    </StatusShell>
  );
}
