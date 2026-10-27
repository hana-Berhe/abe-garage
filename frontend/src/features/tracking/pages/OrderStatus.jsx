import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import trackingApi from "../tracking.api";
import Header, { hoursText } from "../../../layouts/Header";
import Footer from "../../../layouts/Footer";
import { useGarage } from "../../website/useGarage";
import Icon from "../../../shared/components/Icon";
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

function StatusShell({ children }) {
  return (
    <div className="ag">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

const ORDER_STATE = { 1: "Waiting for your OK", 2: "Approved", 3: "In progress", 4: "Ready", 5: "Not going ahead" };

function Message({ title, text }) {
  return (
    <StatusShell>
      <section className="status-page st-empty"><div className="wrap"><h1 className="h2">{title}</h1><p className="lead">{text}</p></div></section>
    </StatusShell>
  );
}

// FR-TRK-02, FR-TRK-03, FR-TRK-08: the customer's private status page. No login.
// Progress only: prices are shown to signed-in staff only, and the desk tells the customer by phone or in person.
export default function OrderStatus() {
  const { hash } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const g = useGarage();

  useEffect(() => { trackingApi.orderStatus(hash).then(setOrder).catch((e) => setError(e)); }, [hash]);

  if (error) {
    return <Message title="Order not found"
      text={error.httpStatus === 404 ? error.message : "We couldn't load your order right now. Please try again later."} />;
  }
  if (!order) return <Message title="Loading…" text="" />;

  const jobsDone = order.lines.filter((l) => l.line_status === 2).length;
  const state = order.status === 4 && order.paid ? "Collected" : ORDER_STATE[order.status];

  return (
    <StatusShell>
      <section className="status-page">
        <div className="wrap">
          <div className="st-head">
            <h1 className="h2">Hi {order.first_name}</h1>
            <span className={`pill st${order.status}`}>{state}</span>
          </div>
          <p className="lead st-intro">
            <b style={{ color: "var(--navy)" }}>{headline(order)}.</b> You can follow your car on this page. We update it as the work goes on,
            and when the status turns green your car is ready to collect.
          </p>

          <div className="st-grid">
            <section className="form">
              <small className="kicker">Progress · Order {order.order_id}</small>
              <h3>Where your car is now</h3>
              <ol className="prog">
                {timeline(order).map((s) => (
                  <li key={s.title} className={s.state}>
                    <span className="dot">{s.state === "done" && <Icon name="check" size={16} stroke={3} />}</span>
                    <div><b>{s.title}</b><small>{s.note}</small></div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="form">
              <small className="kicker">Car in service</small>
              <h3>{order.make} {order.model}{order.color ? ` (${order.color})` : ""}</h3>
              <dl className="kv-list">
                <div><dt>Plate</dt><dd><span className="plate">{order.plate}</span></dd></div>
                {order.year && <div><dt>Year</dt><dd>{order.year}</dd></div>}
                {order.estimated_ready_date && order.status < 4 && <div><dt>Expected ready</dt><dd>{day(order.estimated_ready_date)}</dd></div>}
              </dl>
              <div className="lines" style={{ marginTop: 22 }}>
                {order.garage_address && (
                  <div><Icon name="pin" size={18} /><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.garage_address)}`} target="_blank" rel="noreferrer">{order.garage_address}</a></div>
                )}
                {hoursText(g) && <div><Icon name="clock" size={18} />{hoursText(g)}</div>}
                {order.garage_phone && <div><Icon name="phone" size={18} /><a href={telHref(order.garage_phone)} style={{ fontWeight: 700 }}>{order.garage_phone}</a></div>}
              </div>
              {order.garage_phone && <a href={telHref(order.garage_phone)} className="btn primary" style={{ marginTop: 22 }}><Icon name="phone" size={16} /> Call the garage</a>}
            </section>

            <section className="form wide">
              <small className="kicker">{order.make} {order.model}</small>
              <h3 style={{ marginBottom: 4 }}>Requested service</h3>
              <p className="sub" style={{ marginBottom: 6 }}>{jobsDone} of {order.lines.length} jobs done</p>
              {order.lines.map((l, i) => (
                <div key={i} className="job"><b>{l.name}</b><span className={`pill s${l.line_status}`}>{JOB_STATE[l.line_status]}</span></div>
              ))}
              {order.notes_for_customer && (
                <div className="soft"><Icon name="message" size={18} /><span><b>Message from the garage:</b> {order.notes_for_customer}</span></div>
              )}
              {order.status !== 5 && (
                <div className="soft"><Icon name="info" size={18} /><span>We tell you the price by phone before any work starts. You pay in cash at the front desk when you pick up the car, and get a printed invoice.</span></div>
              )}
              <p className="note"><Icon name="info" size={16} /><span>This page is private to you. Please do not share the link.</span></p>
            </section>
          </div>
        </div>
      </section>
    </StatusShell>
  );
}
