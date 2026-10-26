import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import orderService from "../order.api";
import Alert from "../../../shared/components/Alert";
import OrderDocument from "../components/OrderDocument";
import { date } from "../../../shared/lib/format";

export default function Estimate() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => { orderService.get(id).then(setOrder).catch((e) => setError(e.message)); }, [id]);
  if (!order) return <Alert>{error}</Alert>;
  return (
    <>
      <div className="d-flex gap-2 mb-3 no-print">
        <Link to={`/admin/order/${id}`} className="btn btn-outline-secondary">Back to order</Link>
        <button type="button" className="btn btn-brand" onClick={() => window.print()}>Print</button>
      </div>
      <OrderDocument order={order} title="Estimate" number={`Order ${order.order_id}`}>
        <p className="muted small mt-3">
          Prices include {Number(order.vat_rate)}% VAT added on top of the subtotal.
          {order.estimated_ready_date && ` Estimated ready date: ${date(order.estimated_ready_date)}.`} No work starts before you approve this estimate.
        </p>
      </OrderDocument>
    </>
  );
}
