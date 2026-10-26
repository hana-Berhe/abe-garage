import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";
import { ROLES } from "../../../shared/constants/roles";
import { Brand } from "../../../layouts/Header";
import heroArt from "../../../assets/hero-y.svg";

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
    <div className="login-page">
      <aside className="login-side">
        <Brand small tagline={false} />
        <h1 className="d">Staff app</h1>
        <p>Orders, estimates, jobs and invoices for the whole team. Technicians see their jobs; managers run the desk; the admin keeps prices and staff up to date.</p>
        <img src={heroArt} alt="" />
        <small>Customers don't need an account. They follow their car from the private link we email them.</small>
      </aside>
      <main className="login-main">
        <div className="login-card">
          <h2>Sign in</h2>
          <p className="muted mb-4">Use the email your admin set up for you.</p>
          <Alert kind="info">{location.state?.message}</Alert>
          <Alert>{error && !error.field ? error.message : null}</Alert>
          <form onSubmit={submit} noValidate>
            <Field label="Email" name="email" type="email" autoComplete="username" value={form.email} onChange={change}
              error={error?.field === "email" ? error.message : null} required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" value={form.password}
              onChange={change} error={error?.field === "password" ? error.message : null} required />
            <button type="submit" className="btn btn-brand w-100 mt-2" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <p className="muted small text-center mt-4 mb-0">Forgot your password? Ask the garage admin to reset it.</p>
        </div>
      </main>
    </div>
  );
}
