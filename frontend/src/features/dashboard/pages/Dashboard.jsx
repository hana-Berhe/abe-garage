import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import dashboardApi from "../dashboard.api";
import Alert from "../../../shared/components/Alert";
import { PaidBadge, StatusBadge } from "../../../shared/components/StatusBadge";
import { ROLES } from "../../../shared/constants/roles";
import { date, money } from "../../../shared/lib/format";
import Icon from "../../../shared/components/Icon";

// FR-DSH-02, FR-DSH-03. Each counter opens the matching order list filter. Technicians go to My jobs.
export default function Dashboard() {
  const { employee } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const isTech = employee.role === ROLES.TECHNICIAN;

  const load = () => dashboardApi.get().then(setData).catch((e) => setError(e.message));
  useEffect(() => {
    if (!isTech) load();
  }, [isTech]);

  if (isTech) return <Navigate to="/admin/my-jobs" replace />;

  // [badge text, badge colour, number, line under it, link]
  const counters = data
    ? [
        ["Awaiting approval", "1", data.awaiting_approval, "Call the customer", "/admin/orders?status=1"],
        ["Approved", "2", data.approved, "Not started yet", "/admin/orders?status=2"],
        ["In progress", "3", data.in_progress, "In the workshop now", "/admin/orders?status=3"],
        ["Completed today", "4", data.completed_today, "Since opening today", "/admin/orders?status=4"],
        ["Unpaid", "unpaid", data.unpaid, `${money(data.unpaid_total)} to collect`, "/admin/orders?paid=0"],
      ]
    : [];
  // Quick links, like the tiles in the classic design. Employees and Services are for the admin only.
  const isAdmin = employee.role === ROLES.ADMIN;
  const tiles = [
    ["Open for all", "All orders", "List of orders", "clipboard", "/admin/orders"],
    ["Open for the desk", "New order", "Add order", "plus", "/admin/order/new"],
    ["Open for the desk", "Customers", "See all", "users", "/admin/customers"],
    isAdmin
      ? ["Open for admins", "Employees", "See all", "badge", "/admin/employees"]
      : ["Open for the desk", "Add customer", "Add new", "user", "/admin/customer/new"],
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="page-title mb-0">{greeting}, {employee.name.split(" ")[0]}</h1>
        <Link to="/admin/order/new" className="btn btn-brand">+ New order</Link>
      </div>
      <p className="muted mb-4" style={{ maxWidth: 760 }}>Today in the garage at a glance. Each box opens the matching list.</p>
      <Alert>{error}</Alert>
      <div className="row g-4 mb-4">
        {tiles.map(([kicker, title, more, icon, to]) => (
          <div className="col-6 col-xl-3" key={to}>
            <Link to={to} className="tile">
              <small>{kicker}</small>
              <b>{title}</b>
              <div className="tile-foot"><span>{more} +</span><Icon name={icon} size={44} stroke={1.2} /></div>
            </Link>
          </div>
        ))}
      </div>
      {data && (
        <>
          <div className="row g-3 mb-4">
            {counters.map(([label, tone, value, note, to]) => (
              <div className="col-6 col-md-4 col-xl" key={label}>
                <Link to={to} className="counter d-block text-decoration-none text-reset">
                  <span className={`ag-badge ag-badge--${tone}`}>{label}</span>
                  <div className="counter-value mt-2">{value}</div>
                  <div className="counter-note">{note}</div>
                  <span className="counter-more">View orders +</span>
                </Link>
              </div>
            ))}
          </div>
          <div className="row g-3 mb-4">
            {[["Cash today", data.money_today], ["Cash this week", data.money_week], ["Cash this month", data.money_month], ["Waiting to be paid", data.unpaid_total]].map(([label, value], i) => (
              <div className="col-6 col-lg-3" key={label}>
                <div className={`counter${i === 1 ? " counter--dark" : ""}`}>
                  <div className="counter-label">{label}</div>
                  <div className="counter-value money">{money(value)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="ag-card p-0">
            <h2 className="h4 p-4 m-0">Needs attention</h2>
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead><tr><th>Order</th><th>Customer</th><th>Car</th><th className="d-none d-md-table-cell">Opened</th><th>Status</th><th className="text-end">Total</th></tr></thead>
                <tbody>
                  {data.needs_attention.map((o) => (
                    <tr key={o.order_id}>
                      <td><Link to={`/admin/order/${o.order_id}`} className="fw-semibold">#{o.order_id}</Link></td>
                      <td>{o.first_name} {o.last_name}</td>
                      <td><span className="plate">{o.plate}</span></td>
                      <td className="d-none d-md-table-cell">{date(o.created_at)}</td>
                      <td><div className="d-flex gap-1 flex-wrap"><StatusBadge status={o.status} />{o.status === 4 && <PaidBadge paid={o.paid} />}</div></td>
                      <td className="text-end money">{money(o.total)}</td>
                    </tr>
                  ))}
                  {data.needs_attention.length === 0 && <tr><td colSpan="6" className="muted">Nothing waiting. Nice work.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
          <p className="muted small mt-2">Money counts paid invoices by their paid date ({data.timezone} time).</p>
        </>
      )}
    </>
  );
}
