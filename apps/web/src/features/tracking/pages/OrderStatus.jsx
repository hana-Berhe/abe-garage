import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import trackingApi from "../tracking.api";
import Totals from "../../../shared/components/Totals";
import { LineStatusBadge, PaidBadge, StatusBadge } from "../../../shared/components/StatusBadge";
import { date, dateTime } from "../../../shared/lib/format";

const MESSAGES = {
  1: "We have prepared the price for your car. We will call you to confirm before any work starts.",
  2: "Thank you for approving. Your car is in the queue.",
  3: "Our technicians are working on your car.",
  4: "Your car is ready for pickup.",
  5: "You declined this estimate. Nothing was done to the car.",
};

// FR-TRK-02, FR-TRK-03, FR-TRK-08: the customer's private status page. No login.
export default function OrderStatus() {
  const { hash } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => { trackingApi.orderStatus(hash).then(setOrder).catch((e) => setError(e)); }, [hash]);

  if (error) {
    return (
      <section className="container py-5 page-narrow">
        <h1 className="page-title">Order not found</h1>
        <p>{error.httpStatus === 404 ? error.message : "We couldn't load your order right now. Please try again later."}</p>
      </section>
    );
  }
  if (!order) return <section className="container py-5"><p className="muted">Loading…</p></section>;

  return (
    <section className="container py-5" style={{ maxWidth: 720 }}>
      <p className="muted mb-1">Hello {order.first_name}, here is your car at {order.garage_name}.</p>
      <div className="d-flex gap-2 align-items-center flex-wrap mb-2">
        <h1 className="page-title mb-0">{order.year} {order.make} {order.model}</h1>
        <span className="plate">{order.plate}</span>
      </div>
      <div className="d-flex gap-2 mb-3"><StatusBadge status={order.status} />{order.status === 4 && <PaidBadge paid={order.paid} />}</div>
      <div className="ag-card mb-3">
        <p className="fs-5 mb-1">{MESSAGES[order.status]}</p>
        {order.estimated_ready_date && order.status < 4 && <p className="muted mb-0">Expected ready: {date(order.estimated_ready_date)}</p>}
        {order.completed_at && <p className="muted mb-0">Ready since {dateTime(order.completed_at)}</p>}
        {order.paid ? <p className="muted mb-0">Paid on {dateTime(order.paid_at)}. Thank you!</p> : null}
      </div>
      <div className="ag-card">
        <h2 className="h4">Jobs</h2>
        <table className="table align-middle">
          <tbody>
            {order.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.name}</td>
                <td><LineStatusBadge status={l.line_status} /></td>
                <td className="text-end money">${Number(l.line_price).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Totals subtotal={order.subtotal} vatRate={order.vat_rate} vatAmount={order.vat_amount} total={order.total} />
        {order.notes_for_customer && <p className="mt-3 mb-0"><strong>Note from the garage:</strong> {order.notes_for_customer}</p>}
      </div>
      <p className="muted small mt-3">Questions? Call {order.garage_name}{order.garage_phone ? ` on ${order.garage_phone}` : ""}. Payment is in cash at pickup.</p>
    </section>
  );
}
