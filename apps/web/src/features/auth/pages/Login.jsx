import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import Icon from "../../../shared/components/Icon";
import { ROLES } from "../../../shared/constants/roles";
import { Brand } from "../../../layouts/Header";
import gearArt from "../../../assets/gear.svg";

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

  const bad = (name) => (error?.field === name ? "bad" : undefined);

  return (
    <div className="ag login">
      <section className="hero">
        <Brand />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="eyebrow">Staff only</div>
          <h1>Garage desk<br /><em>and workshop.</em></h1>
          <p>Orders, job cards, invoices and call-back requests, in one place. For Admin, Manager and Technician accounts.</p>
        </div>
        <div className="facts">
          <span><Icon name="cash" size={18} />Cash only</span>
          <span><Icon name="clock" size={18} />Opens 8:00 AM</span>
        </div>
        <img className="gear" src={gearArt} alt="" />
      </section>
      <main className="side">
        <form className="form" onSubmit={submit} noValidate>
          <h3>Sign in</h3>
          <p className="sub">Use the email your admin set up for you.</p>
          {location.state?.message && <div className="alert-info" role="status">{location.state.message}</div>}
          <div className="fields" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
            <label className="field">Email
              <input name="email" type="email" autoComplete="username" value={form.email} onChange={change} required
                className={bad("email")} aria-invalid={!!bad("email")} />
              {bad("email") && <span className="err">{error.message}</span>}
            </label>
            <label className="field">Password
              <input name="password" type="password" autoComplete="current-password" value={form.password} onChange={change} required
                className={bad("password")} aria-invalid={!!bad("password")} />
              {bad("password") && <span className="err">{error.message}</span>}
            </label>
          </div>
          {error && !error.field && <div className="alert-bad" role="alert">{error.message}</div>}
          <button type="submit" className="btn primary" style={{ width: "100%", marginTop: 22 }} disabled={busy}>
            {busy ? "Signing in…" : <>Sign in <Icon name="arrow" size={16} stroke={2.5} /></>}
          </button>
          <p className="note"><Icon name="info" size={16} /><span>Forgot your password? Ask the garage admin to reset it. Customers do not need an account: they follow their car from the private link we email them.</span></p>
        </form>
      </main>
    </div>
  );
}
