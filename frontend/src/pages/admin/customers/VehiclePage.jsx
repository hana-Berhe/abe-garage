import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import vehicleService from "../../../services/vehicle.service";
import Alert from "../../../components/Alert";
import VehicleFields from "../../../components/VehicleFields";
import { PaidBadge, StatusBadge } from "../../../components/StatusBadge";
import { useAuth } from "../../../context/AuthContext";
import { OFFICE } from "../../../services/roles";
import { date, money } from "../../../utils/format";

const toForm = (v) => Object.fromEntries(Object.entries(v).map(([k, val]) => [k, val ?? ""]));

// FR-VEH-03 edit, FR-VEH-04 service history.
export default function VehiclePage() {
  const { id } = useParams();
  const { employee } = useAuth();
  const canEdit = OFFICE.includes(employee.role);
  const [car, setCar] = useState(null);
  const [form, setForm] = useState(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    vehicleService.get(id).then((v) => { setCar(v); setForm(toForm(v)); }).catch(setError);
  }, [id]);

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const saved = await vehicleService.update(id, form);
      setCar({ ...car, ...saved });
      setForm(toForm(saved));
      setEditing(false);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (!car) return <Alert>{error?.message}</Alert>;
  const fieldError = (n) => (error?.field === n ? error.message : null);

  return (
    <>
      <p className="muted small mb-2">
        <Link to={`/admin/customer/${car.customer_id}`}>{car.customer_first_name} {car.customer_last_name}</Link> / Car
      </p>
      <div className="ag-card">
        <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
          <h1 className="page-title mb-0">{car.year} {car.make} {car.model}</h1>
          <span className="plate align-self-center fs-5">{car.plate}</span>
        </div>
        <Alert>{error && !error.field ? error.message : null}</Alert>
        {editing ? (
          <form onSubmit={save} noValidate>
            <VehicleFields value={form} onChange={setForm} fieldError={fieldError} />
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : "Save car"}</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => { setEditing(false); setForm(toForm(car)); setError(null); }}>Cancel</button>
            </div>
          </form>
        ) : (
          <>
            <dl className="kv">
              <div><dt>Type</dt><dd>{car.type || "–"}</dd></div>
              <div><dt>Color</dt><dd>{car.color || "–"}</dd></div>
              <div><dt>Mileage</dt><dd>{car.mileage != null ? `${car.mileage.toLocaleString()} km` : "–"}</dd></div>
              <div><dt>VIN</dt><dd>{car.vin || "Not given"}</dd></div>
            </dl>
            {canEdit && <button type="button" className="btn btn-outline-secondary mt-3" onClick={() => setEditing(true)}>Edit car</button>}
          </>
        )}
      </div>
      <div className="ag-card p-0">
        <h2 className="h4 p-3 m-0">Service history</h2>
        <div className="table-responsive">
          <table className="table align-middle">
            <thead><tr><th>Order</th><th>Date</th><th>Jobs</th><th>Status</th><th>Paid</th><th className="text-end">Total</th></tr></thead>
            <tbody>
              {car.orders.map((o) => (
                <tr key={o.order_id}>
                  <td><Link to={`/admin/order/${o.order_id}`}>#{o.order_id}</Link></td>
                  <td>{date(o.created_at)}</td>
                  <td>{o.jobs || "–"}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td>{o.status === 4 ? <PaidBadge paid={o.paid} /> : "–"}</td>
                  <td className="text-end money">{money(o.total)}</td>
                </tr>
              ))}
              {car.orders.length === 0 && <tr><td colSpan="6" className="muted">No visits yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
