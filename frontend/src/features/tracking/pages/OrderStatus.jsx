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
const headTail = (text) => { const i = text.indexOf(" is "); return i > 0 ? [text.slice(0, i + 4), text.slice(i + 4)] : [text, ""]; };

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

function Message({ title, text }) {
  return (
    <StatusShell>
      <section className="ph st-empty"><div className="wrap"><div className="eyebrow">Your car</div><h1>{title}</h1><p>{text}</p></div></section>
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
  const [first, rest] = headTail(headline(order));

  return (
    <StatusShell>
      <section className="ph status">
        <div className="wrap">
          <div className="eyebrow">Order {order.order_id}</div>
          <h1>Hi {order.first_name}, {first.charAt(0).toLowerCase() + first.slice(1)}{rest && <><br /><em>{rest}</em></>}</h1>
          <div className="car">{order.year} {order.make} {order.model}{order.color ? ` · ${order.color}` : ""} <span className="plate">{order.plate}</span></div>
        </div>
      </section>

      <div className="wrap st-grid">
        <section className="form">
          <h3>Progress</h3>
          <ol className="prog">
            {timeline(order).map((s) => (
              <li key={s.title} className={s.state}>
                <span className="dot">{s.state === "done" && <Icon name="check" size={16} stroke={3} />}</span>
                <div><b>{s.title}</b><small>{s.note}</small></div>
              </li>
            ))}
          </ol>
          {order.estimated_ready_date && order.status < 4 && (
            <div className="soft"><Icon name="clock" size={18} /><span>Expected ready: <b>{day(order.estimated_ready_date)}</b></span></div>
          )}
        </section>

        <section className="form">
          <h3 style={{ marginBottom: 4 }}>The work on your car</h3>
          <p className="sub" style={{ marginBottom: 6 }}>{jobsDone} of {order.lines.length} jobs done</p>
          {order.lines.map((l, i) => (
            <div key={i} className="job"><span>{l.name}</span><span className={`pill s${l.line_status}`}>{JOB_STATE[l.line_status]}</span></div>
          ))}
          {order.notes_for_customer && (
            <div className="soft"><Icon name="message" size={18} /><span><b>Message from the garage:</b> {order.notes_for_customer}</span></div>
          )}
          {order.status !== 5 && (
            <div className="soft"><Icon name="info" size={18} /><span>We tell you the price by phone before any work starts. You pay in cash at the front desk when you pick up the car, and get a printed invoice.</span></div>
          )}
        </section>

        <section className="form">
          <h3>Picking up</h3>
          <div className="lines">
            {order.garage_address && (
              <div><Icon name="pin" size={18} /><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.garage_address)}`} target="_blank" rel="noreferrer">{order.garage_address}</a></div>
            )}
            {hoursText(g) && <div><Icon name="clock" size={18} />{hoursText(g)}</div>}
            {order.garage_phone && <div><Icon name="phone" size={18} /><a href={telHref(order.garage_phone)} style={{ fontWeight: 700 }}>{order.garage_phone}</a></div>}
          </div>
          {order.garage_phone && <a href={telHref(order.garage_phone)} className="btn primary" style={{ width: "100%", marginTop: 20 }}><Icon name="phone" size={16} /> Call the garage</a>}
          <p className="note"><Icon name="info" size={16} /><span>This page is private to you. Please do not share the link.</span></p>
        </section>
      </div>
    </StatusShell>
  );
}
