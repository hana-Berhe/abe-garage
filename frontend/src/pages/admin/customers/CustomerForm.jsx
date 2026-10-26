import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import customerService from "../../../services/customer.service";
import Field from "../../../components/Field";
import Alert from "../../../components/Alert";
import VehicleFields, { EMPTY_VEHICLE } from "../../../components/VehicleFields";

const EMPTY = { first_name: "", last_name: "", email: "", phone: "", active: 1 };

export default function CustomerForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [withCar, setWithCar] = useState(true);
  const [vehicle, setVehicle] = useState(EMPTY_VEHICLE);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) customerService.get(id).then((c) => setForm(c)).catch(setError);
  }, [id, editing]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? (checked ? 1 : 0) : value });
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = {
        first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone,
        active: form.active, updated_at: form.updated_at,
      };
      if (!editing && withCar) body.vehicle = vehicle;
      const saved = editing ? await customerService.update(id, body) : await customerService.create(body);
      navigate(`/admin/customer/${saved.customer_id}`);
    } catch (err) {
      setError(err); // typed values stay on screen (NFR-16)
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : null);

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="page-title">{editing ? "Edit customer" : "New customer"}</h1>
      <Alert>{error && !error.field ? error.message : null}</Alert>
      <form onSubmit={submit} noValidate>
        <div className="ag-card">
          <div className="row">
            <div className="col-sm-6"><Field label="First name" name="first_name" value={form.first_name} onChange={change} error={fieldError("first_name")} /></div>
            <div className="col-sm-6"><Field label="Last name" name="last_name" value={form.last_name} onChange={change} error={fieldError("last_name")} /></div>
            <div className="col-sm-6"><Field label="Phone" name="phone" type="tel" value={form.phone} onChange={change} error={fieldError("phone")} /></div>
            <div className="col-sm-6"><Field label="Email (status link is sent here)" name="email" type="email" value={form.email} onChange={change} error={fieldError("email")} /></div>
          </div>
          {editing && (
            <div className="form-check">
              <input id="f-active" className="form-check-input" type="checkbox" name="active" checked={!!form.active} onChange={change} />
              <label htmlFor="f-active" className="form-check-label">Active</label>
            </div>
          )}
        </div>
        {!editing && (
          <div className="ag-card">
            <div className="form-check mb-3">
              <input id="f-withcar" className="form-check-input" type="checkbox" checked={withCar} onChange={(e) => setWithCar(e.target.checked)} />
              <label htmlFor="f-withcar" className="form-check-label fw-semibold">Add their car now</label>
            </div>
            {withCar && <VehicleFields value={vehicle} onChange={setVehicle} fieldError={fieldError} prefix="vehicle." />}
          </div>
        )}
        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add customer"}</button>
          <Link to={editing ? `/admin/customer/${id}` : "/admin/customers"} className="btn btn-outline-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
