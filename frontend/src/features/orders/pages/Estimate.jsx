import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import orderService from "../order.api";
import Alert from "../../../shared/components/Alert";
import OrderDocument from "../components/OrderDocument";
import { date } from "../../../shared/lib/format";

// OrderDocument (shared with the invoice) reads a flat order, so lay the estimate out the same way.
const toDocument = (e) => ({
  ...e.customer,
  ...e.vehicle,
  garage: e.garage,
  lines: e.lines.map((l) => ({ line_id: l.line_id, name: l.service_name, line_price: l.line_price })),
  subtotal: e.subtotal,
  vat_rate: e.vat_rate,
  vat_amount: e.vat_amount,
  total: e.total,
  notes_for_customer: e.notes_for_customer,
});

export default function Estimate() {
  const { id } = useParams();
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { orderService.estimate(id).then(setEstimate).catch((e) => setError(e.message)); }, [id]);
  if (!estimate) return <Alert>{error}</Alert>;
  return (
    <>
      <div className="d-flex gap-2 mb-3 no-print">
        <Link to={`/admin/order/${id}`} className="btn btn-outline-secondary">Back to order</Link>
        <button type="button" className="btn btn-brand" onClick={() => window.print()}>Print</button>
      </div>
      <OrderDocument order={toDocument(estimate)} title="Estimate" number={estimate.estimate_number} docDate={estimate.issued_at}>
        <p className="muted small mt-3">
          Prices include {Number(estimate.vat_rate)}% VAT added on top of the subtotal.
          {estimate.estimated_ready_date && ` Estimated ready date: ${date(estimate.estimated_ready_date)}.`} No work starts before you approve this estimate.
        </p>
      </OrderDocument>
    </>
  );
}
