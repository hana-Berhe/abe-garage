import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import orderService from "../../../services/order.service";
import Pagination from "../../../components/Pagination";
import SearchBox from "../../../components/SearchBox";
import Alert from "../../../components/Alert";
import { ORDER_STATUS, PaidBadge, StatusBadge } from "../../../components/StatusBadge";
import { useAuth } from "../../../context/AuthContext";
import { OFFICE } from "../../../services/roles";
import { date, money } from "../../../utils/format";

// FR-ORD-05. Filters live in the address so dashboard counters can link here.
export default function OrderList() {
  const { employee } = useAuth();
  const [params, setParams] = useSearchParams();
  const query = {
    page: Number(params.get("page")) || 1,
    search: params.get("search") || "",
    status: params.get("status") || "",
    paid: params.get("paid") || "",
  };
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const key = params.toString();

  useEffect(() => {
    let live = true;
    orderService.list(query).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (changes) => {
      const next = new URLSearchParams(params);
      Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
      if (!("page" in changes)) next.delete("page");
      setParams(next);
    },
    [params, setParams]
  );
  const onSearch = useCallback((search) => set({ search }), [set]);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="page-title mb-0">Orders</h1>
        {OFFICE.includes(employee.role) && <Link to="/admin/order/new" className="btn btn-brand">+ New order</Link>}
      </div>
      <div className="row g-2 mb-3">
        <div className="col-md-5"><SearchBox value={query.search} onSearch={onSearch} placeholder="Customer, phone, plate or order number" /></div>
        <div className="col-6 col-md-4">
          <select className="form-select" aria-label="Status" value={query.status} onChange={(e) => set({ status: e.target.value })}>
            <option value="">All statuses</option>
            {Object.entries(ORDER_STATUS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <select className="form-select" aria-label="Paid" value={query.paid} onChange={(e) => set({ paid: e.target.value })}>
            <option value="">Paid or unpaid</option>
            <option value="0">Unpaid (completed)</option>
            <option value="1">Paid</option>
          </select>
        </div>
      </div>
      <Alert>{error}</Alert>
      {data && (
        <div className="ag-card p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr><th>Order</th><th>Customer</th><th>Car</th><th className="d-none d-lg-table-cell">Date</th><th>Status</th><th className="text-end">Total</th></tr>
              </thead>
              <tbody>
                {data.rows.map((o) => (
                  <tr key={o.order_id}>
                    <td><Link to={`/admin/order/${o.order_id}`} className="fw-semibold">#{o.order_id}</Link></td>
                    <td>{o.first_name} {o.last_name}</td>
                    <td><span className="plate">{o.plate}</span> <span className="muted small d-none d-md-inline">{o.make} {o.model}</span></td>
                    <td className="d-none d-lg-table-cell">{date(o.created_at)}</td>
                    <td><div className="d-flex gap-1 flex-wrap"><StatusBadge status={o.status} />{o.status === 4 && <PaidBadge paid={o.paid} />}</div></td>
                    <td className="text-end money">{money(o.total)}</td>
                  </tr>
                ))}
                {data.rows.length === 0 && <tr><td colSpan="6" className="muted">No orders match.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="px-3 pb-3"><Pagination {...data} onChange={(page) => set({ page: String(page) })} /></div>
        </div>
      )}
    </>
  );
}
