import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Modal } from "react-bootstrap";
import customerService from "../customer.api";
import vehicleService from "../vehicle.api";
import Alert from "../../../shared/components/Alert";
import VehicleFields, { EMPTY_VEHICLE } from "../components/VehicleFields";
import { ActiveBadge, PaidBadge, StatusBadge } from "../../../shared/components/StatusBadge";
import { useAuth } from "../../auth/AuthContext";
import { OFFICE } from "../../../shared/constants/roles";
import { date, money } from "../../../shared/lib/format";

// FR-CUS-05: details, cars, order history and money owed.
export default function CustomerProfile() {
  const { id } = useParams();
  const { employee } = useAuth();
  const canEdit = OFFICE.includes(employee.role);
  const [customer, setCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [carError, setCarError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => customerService.get(id).then(setCustomer).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load]);

  async function addCar(e) {
    e.preventDefault();
    setBusy(true);
    setCarError(null);
    try {
      await vehicleService.create({ ...vehicle, customer_id: Number(id) });
      setAdding(false);
      setVehicle(EMPTY_VEHICLE);
      load();
    } catch (err) {
      setCarError(err);
    } finally {
      setBusy(false);
    }
  }

  if (!customer) return <Alert>{error}</Alert>;
  const openOrder = customer.orders.find((o) => o.status >= 1 && o.status <= 3);

  return (
    <>
      <p className="muted small mb-2"><Link to="/admin/customers">Customers</Link> / {customer.first_name} {customer.last_name}</p>
      <div className="ag-card">
        <div className="d-flex justify-content-between flex-wrap gap-3">
          <div>
            <h1 className="page-title mb-1">{customer.first_name} {customer.last_name}</h1>
            <p className="muted mb-0">Customer since {date(customer.created_at)} · {customer.orders.length} orders <ActiveBadge active={customer.active} /></p>
          </div>
          {canEdit && (
            <div className="d-flex gap-2 align-items-start flex-wrap">
              <Link to={`/admin/customer/${id}/edit`} className="btn btn-outline-secondary">Edit details</Link>
              {customer.active ? <Link to={`/admin/order/new?customer=${id}`} className="btn btn-brand">New order</Link> : null}
            </div>
          )}
        </div>
        <hr />
        <dl className="kv">
          <div><dt>Phone</dt><dd><a href={`tel:${customer.phone}`}>{customer.phone}</a></dd></div>
          <div><dt>Email</dt><dd>{customer.email}</dd></div>
          <div><dt>Money owed</dt><dd className={Number(customer.unpaid_total) > 0 ? "text-danger" : ""}>{money(customer.unpaid_total)}</dd></div>
          <div><dt>Open order</dt><dd>{openOrder ? <Link to={`/admin/order/${openOrder.order_id}`}>#{openOrder.order_id}</Link> : "None"}</dd></div>
        </dl>
      </div>

      <div className="card-title-row mt-4">
        <h2 className="h4 m-0">Cars</h2>
        {canEdit && <button type="button" className="btn btn-outline-secondary" onClick={() => setAdding(true)}>+ Add car</button>}
      </div>
      <div className="row g-3">
        {customer.vehicles.map((v) => (
          <div className="col-md-6" key={v.vehicle_id}>
            <Link to={`/admin/vehicle/${v.vehicle_id}`} className="ag-card d-block text-decoration-none text-reset h-100">
              <div className="d-flex justify-content-between gap-2">
                <div>
                  <div className="fw-bold">{v.year} {v.make} {v.model}</div>
                  <div className="muted small">{[v.type, v.color].filter(Boolean).join(" · ") || "–"}</div>
                </div>
                <span className="plate align-self-start">{v.plate}</span>
              </div>
              <dl className="kv mt-3">
                <div><dt>Mileage</dt><dd>{v.mileage != null ? `${v.mileage.toLocaleString()} km` : "–"}</dd></div>
                <div><dt>VIN</dt><dd>{v.vin || "Not given"}</dd></div>
              </dl>
            </Link>
          </div>
        ))}
        {customer.vehicles.length === 0 && <p className="muted">No cars yet.</p>}
      </div>

      <div className="ag-card p-0 mt-4">
        <h2 className="h4 p-3 m-0">Order history</h2>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Order</th><th>Date</th><th>Car</th><th>Status</th><th>Paid</th><th className="text-end">Total</th></tr></thead>
            <tbody>
              {customer.orders.map((o) => (
                <tr key={o.order_id}>
                  <td><Link to={`/admin/order/${o.order_id}`}>#{o.order_id}</Link></td>
                  <td>{date(o.created_at)}</td>
                  <td><span className="plate">{o.plate}</span></td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.status === 4 ? <PaidBadge paid={o.paid} /> : "–"}</td>
                  <td className="text-end money">{money(o.total)}</td>
                </tr>
              ))}
              {customer.orders.length === 0 && <tr><td colSpan="6" className="muted">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal show={adding} onHide={() => setAdding(false)} size="lg" centered>
        <form onSubmit={addCar} noValidate>
          <Modal.Header closeButton><Modal.Title>Add a car for {customer.first_name}</Modal.Title></Modal.Header>
          <Modal.Body>
            <Alert>{carError && !carError.field ? carError.message : null}</Alert>
            <VehicleFields value={vehicle} onChange={setVehicle} fieldError={(n) => (carError?.field === n ? carError.message : null)} />
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setAdding(false)}>Cancel</button>
            <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : "Add car"}</button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}
