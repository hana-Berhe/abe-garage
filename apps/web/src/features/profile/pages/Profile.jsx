import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import employeeService from "../../employees/employee.api";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";
import { date } from "../../../shared/lib/format";

export default function Profile() {
  const { endSession } = useAuth();
  const [me, setMe] = useState(null);
  const [form, setForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // BE-008: always the saved details, not what the login remembered.
  useEffect(() => {
    employeeService.profile().then(setMe).catch(setError);
  }, []);

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
      {me && (
        <div className="ag-card p-3">
          <dl className="kv mb-0">
            <div><dt>Name</dt><dd>{me.first_name} {me.last_name}</dd></div>
            <div><dt>Role</dt><dd>{me.role_name}</dd></div>
            <div><dt>Email</dt><dd>{me.email}</dd></div>
            <div><dt>Phone</dt><dd>{me.phone || "Not given"}</dd></div>
            <div><dt>Staff since</dt><dd>{date(me.created_at)}</dd></div>
          </dl>
          <p className="muted small mt-2 mb-0">Only the admin can change these details.</p>
        </div>
      )}
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
