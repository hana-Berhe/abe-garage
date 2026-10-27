import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authApi from "../auth.api";
import AuthShell from "../AuthShell";
import Icon from "../../../shared/components/Icon";

// BE-006: opened from the emailed link. It doesn't log the person in; they sign in with the new password.
export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError({ field: "confirm", message: "The two passwords are not the same" });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.resetPassword(token, form.password);
      navigate("/login", { replace: true, state: { message: "Password changed. Sign in with your new password." } });
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  const bad = (name) => (error?.field === name ? "bad" : undefined);
  const linkProblem = !token || (error && !error.field && error.httpStatus === 400);

  return (
    <AuthShell>
      <form className="form" onSubmit={submit} noValidate>
        <h3>Choose a new password</h3>
        <p className="sub">At least 8 characters. You will be signed out on every device.</p>
        {linkProblem ? (
          <>
            <div className="alert-bad" role="alert">{error?.message || "This reset link is incomplete. Open it again from your email."}</div>
            <Link to="/forgot-password" className="btn primary" style={{ width: "100%", marginTop: 22 }}>Ask for a new link</Link>
          </>
        ) : (
          <>
            <div className="fields" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
              <label className="field">New password
                <input name="password" type="password" autoComplete="new-password" value={form.password} onChange={change} required
                  className={bad("new_password")} aria-invalid={!!bad("new_password")} />
                {bad("new_password") && <span className="err">{error.message}</span>}
              </label>
              <label className="field">New password again
                <input name="confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={change} required
                  className={bad("confirm")} aria-invalid={!!bad("confirm")} />
                {bad("confirm") && <span className="err">{error.message}</span>}
              </label>
            </div>
            {error && !error.field && <div className="alert-bad" role="alert">{error.message}</div>}
            <button type="submit" className="btn primary" style={{ width: "100%", marginTop: 22 }} disabled={busy}>
              {busy ? "Saving…" : <>Save new password <Icon name="arrow" size={16} stroke={2.5} /></>}
            </button>
          </>
        )}
        <p style={{ textAlign: "center", margin: "16px 0 0", fontSize: 14 }}><Link to="/login">Back to sign in</Link></p>
      </form>
    </AuthShell>
  );
}
