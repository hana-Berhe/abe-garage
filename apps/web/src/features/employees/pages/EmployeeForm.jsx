import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import employeeService from "../employee.api";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";
import { ROLE_NAMES } from "../../../shared/constants/roles";

// Shown until the server list arrives, so the form never waits on it.
const FALLBACK_ROLES = Object.entries(ROLE_NAMES).map(([role_id, role_name]) => ({ role_id: Number(role_id), role_name }));

const EMPTY = { email: "", first_name: "", last_name: "", phone: "", role_id: "1", active: 1, password: "" };

export default function EmployeeForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [roles, setRoles] = useState(FALLBACK_ROLES);

  useEffect(() => {
    employeeService.roles().then((d) => setRoles(d.roles)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editing) return;
    employeeService
      .get(id)
      .then((e) => setForm({ ...e, phone: e.phone || "", role_id: String(e.role_id), password: "" }))
      .catch(setError);
  }, [id, editing]);

  const change = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? (checked ? 1 : 0) : value });
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = { ...form, role_id: Number(form.role_id) };
    if (editing && !body.password) delete body.password;
    try {
      if (editing) await employeeService.update(id, body);
      else await employeeService.create(body);
      navigate("/admin/employees");
    } catch (err) {
      // On 409 the typed values stay on screen (NFR-16).
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : null);

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="page-title">{editing ? "Edit employee" : "Add a new employee"}</h1>
      <Alert>{error && !error.field ? error.message : null}</Alert>
      <form onSubmit={submit} noValidate>
        <Field label="Email" name="email" type="email" value={form.email} onChange={change} error={fieldError("email")} />
        <div className="row">
          <div className="col-sm-6">
            <Field label="First name" name="first_name" value={form.first_name} onChange={change} error={fieldError("first_name")} />
          </div>
          <div className="col-sm-6">
            <Field label="Last name" name="last_name" value={form.last_name} onChange={change} error={fieldError("last_name")} />
          </div>
        </div>
        <Field label="Phone" name="phone" type="tel" value={form.phone} onChange={change} error={fieldError("phone")} />
        <Field label="Role" name="role_id" as="select" value={form.role_id} onChange={change} error={fieldError("role_id")}>
          {roles.map((r) => (
            <option key={r.role_id} value={String(r.role_id)}>{r.role_name}</option>
          ))}
        </Field>
        <Field
          label={editing ? "New password (leave empty to keep the current one)" : "Password (at least 8 characters)"}
          name="password" type="password" autoComplete="new-password" value={form.password} onChange={change}
          error={fieldError("password")}
        />
        <div className="form-check mb-3">
          <input id="f-active" className="form-check-input" type="checkbox" name="active" checked={!!form.active} onChange={change} />
          <label htmlFor="f-active" className="form-check-label">Active (can log in and get jobs)</label>
          {fieldError("active") && <div className="text-danger small">{fieldError("active")}</div>}
        </div>
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add employee"}</button>
          <Link to="/admin/employees" className="btn btn-outline-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
