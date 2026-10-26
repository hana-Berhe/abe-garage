import Icon from "../../../shared/components/Icon";
import Totals from "../../../shared/components/Totals";
import { date, money } from "../../../shared/lib/format";

// The printable estimate and invoice share one A4 layout (FR-EST-01, FR-INV-01, NFR-12).
export default function OrderDocument({ order, title, number, children }) {
  const g = order.garage || {};
  return (
    <article className="order-doc ag-card">
      <header className="d-flex justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <div className="brand"><span className="brand-mark" aria-hidden="true"><Icon name="wrench" size={20} /></span>{g.name}</div>
          <div className="muted small mt-1">{[g.address, g.phone, g.email].filter(Boolean).join(" · ")}</div>
        </div>
        <div className="text-end">
          <div className="ag-display fs-1">{title}</div>
          <div className="fw-semibold">{number}</div>
          <div className="muted small">Date {date(new Date())}</div>
        </div>
      </header>
      <div className="row mb-4">
        <div className="col-6">
          <div className="muted small text-uppercase fw-semibold">Customer</div>
          <div>{order.first_name} {order.last_name}</div>
          <div className="small">{order.phone}</div>
          <div className="small">{order.email}</div>
        </div>
        <div className="col-6">
          <div className="muted small text-uppercase fw-semibold">Car</div>
          <div>{order.year} {order.make} {order.model}</div>
          <div className="small">Plate {order.plate}{order.vin ? ` · VIN ${order.vin}` : ""}</div>
          {order.mileage != null && <div className="small">{order.mileage.toLocaleString()} km</div>}
        </div>
      </div>
      <table className="table">
        <thead><tr><th>#</th><th>Job</th><th className="text-end">Price</th></tr></thead>
        <tbody>
          {order.lines.map((l, i) => (
            <tr key={l.line_id}><td>{i + 1}</td><td>{l.name}</td><td className="text-end money">{money(l.line_price)}</td></tr>
          ))}
        </tbody>
      </table>
      <Totals subtotal={order.subtotal} vatRate={order.vat_rate} vatAmount={order.vat_amount} total={order.total} />
      {order.notes_for_customer && <p className="mt-4"><strong>Note:</strong> {order.notes_for_customer}</p>}
      {children}
    </article>
  );
}
