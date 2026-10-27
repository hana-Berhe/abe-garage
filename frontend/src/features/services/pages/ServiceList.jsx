import { useCallback, useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import serviceService from "../service.api";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";
import { ActiveBadge } from "../../../shared/components/StatusBadge";
import { money } from "../../../shared/lib/format";
import { pick } from "../../../shared/lib/pick";

const EMPTY = { name: "", description: "", price: "", labor_hours: "", active: 1 };

// FR-SRV-01..03: the price list. A new price applies to new orders only.
export default function ServiceList() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => serviceService.list().then(setServices).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const open = (s) => {
    setFormError(null);
    setForm(s ? { ...s, description: s.description || "" } : EMPTY);
  };
  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? (checked ? 1 : 0) : value });
  };

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const body = pick(form, ["name", "description", "price", "labor_hours", "active"]);
      if (form.service_id) await serviceService.update(form.service_id, { ...body, updated_at: form.updated_at });
      else await serviceService.create(body);
      setForm(null);
      load();
    } catch (err) {
      setFormError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (n) => (formError?.field === n ? formError.message : null);

  return (
    <>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
        <h1 className="page-title mb-0">Services</h1>
        <button type="button" className="btn btn-brand" onClick={() => open(null)}>+ Add service</button>
      </div>
      <p className="muted">Prices are before VAT. Changing a price only affects new orders.</p>
      <Alert>{error}</Alert>
      {services && (
        <div className="ag-card p-0">
          <div className="table-responsive">
            <table className="table align-middle">
              <thead><tr><th>Service</th><th className="text-end">Price</th><th className="text-end d-none d-sm-table-cell">Hours</th><th>Status</th><th /></tr></thead>
              <tbody>
                {services.map((s) => (
                  <tr key={s.service_id}>
                    <td><div className="fw-semibold">{s.name}</div><div className="muted small">{s.description}</div></td>
                    <td className="text-end money">{money(s.price)}</td>
                    <td className="text-end d-none d-sm-table-cell">{Number(s.labor_hours)}</td>
                    <td><ActiveBadge active={s.active} /></td>
                    <td className="text-end"><button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => open(s)}>Edit</button></td>
                  </tr>
                ))}
                {services.length === 0 && <tr><td colSpan="5" className="muted">No services yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Modal show={!!form} onHide={() => setForm(null)} centered>
        {form && (
          <form onSubmit={save} noValidate>
            <Modal.Header closeButton><Modal.Title>{form.service_id ? "Edit service" : "Add service"}</Modal.Title></Modal.Header>
            <Modal.Body>
              <Alert>{formError && !formError.field ? formError.message : null}</Alert>
              <Field label="Name" name="name" value={form.name} onChange={change} error={fieldError("name")} />
              <Field label="Description" name="description" as="textarea" rows={2} value={form.description} onChange={change} error={fieldError("description")} />
              <div className="row">
                <div className="col-6"><Field label="Price before VAT" name="price" type="number" step="0.01" min="0" value={form.price} onChange={change} error={fieldError("price")} /></div>
                <div className="col-6"><Field label="Labor hours" name="labor_hours" type="number" step="0.25" min="0" value={form.labor_hours} onChange={change} error={fieldError("labor_hours")} /></div>
              </div>
              <div className="form-check">
                <input id="f-active" className="form-check-input" type="checkbox" name="active" checked={!!form.active} onChange={change} />
                <label htmlFor="f-active" className="form-check-label">Active (offered on new orders and the website)</label>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-outline-secondary" onClick={() => setForm(null)}>Cancel</button>
              <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : "Save service"}</button>
            </Modal.Footer>
          </form>
        )}
      </Modal>
    </>
  );
}
