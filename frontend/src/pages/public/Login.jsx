import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Field from "../../components/Field";
import Alert from "../../components/Alert";
import { ROLES } from "../../services/roles";

export default function Login() {
  const { login, employee } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (employee) return <Navigate to="/admin" replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const who = await login(form.email.trim(), form.password);
      const home = who.role === ROLES.TECHNICIAN ? "/admin/my-jobs" : "/admin";
      navigate(location.state?.from || home, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="page-title">Login to your account</h1>
      <Alert kind="info">{location.state?.message}</Alert>
      <Alert>{error && !error.field ? error.message : null}</Alert>
      <form onSubmit={submit} noValidate>
        <Field label="Email" name="email" type="email" autoComplete="username" value={form.email} onChange={change}
          error={error?.field === "email" ? error.message : null} required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password}
          onChange={change} error={error?.field === "password" ? error.message : null} required />
        <button type="submit" className="btn btn-brand w-100" disabled={busy}>
          {busy ? "Logging in…" : "Login"}
        </button>
      </form>
    </section>
  );
}
