import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import employeeService from "../../employees/employee.api";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";
import { ROLE_NAMES } from "../../../shared/constants/roles";

export default function Profile() {
  const { employee, endSession } = useAuth();
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.new_password !== form.confirm) {
      setError({ field: "confirm", message: "The two new passwords are different" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await employeeService.changePassword(form.old_password, form.new_password);
      // The server signs this account out everywhere, so log in again with the new password.
      endSession("Password changed. Please log in again with your new password.");
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : null);

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="page-title">My account</h1>
      <p>{employee.name} · {ROLE_NAMES[employee.role]}</p>
      <h2 className="h5 mt-4">Change password</h2>
      <Alert>{error && !error.field ? error.message : null}</Alert>
      <form onSubmit={submit} noValidate>
        <Field label="Current password" name="old_password" type="password" autoComplete="current-password" value={form.old_password} onChange={change} error={fieldError("old_password")} />
        <Field label="New password (at least 8 characters)" name="new_password" type="password" autoComplete="new-password" value={form.new_password} onChange={change} error={fieldError("new_password")} />
        <Field label="New password again" name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={change} error={fieldError("confirm")} />
        <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : "Change password"}</button>
      </form>
    </div>
  );
}
