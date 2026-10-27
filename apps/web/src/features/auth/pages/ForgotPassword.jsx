import { useState } from "react";
import { Link } from "react-router-dom";
import authApi from "../auth.api";
import AuthShell from "../AuthShell";
import Icon from "../../../shared/components/Icon";

// BE-005: the answer is the same whether or not the email belongs to a staff account.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(email.trim());
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const bad = error?.field === "email" ? "bad" : undefined;

  return (
    <AuthShell>
      {sent ? (
        <div className="form">
          <h3>Check your email</h3>
          <p className="sub">If <strong>{sent}</strong> belongs to an active staff account, we have sent it a link to choose a new password. The link works once, for 15 minutes.</p>
          <p className="note"><Icon name="info" size={16} /><span>Nothing arrived? Check your spam folder, or ask the garage admin to set a new password for you.</span></p>
          <Link to="/login" className="btn primary" style={{ width: "100%", marginTop: 22 }}>Back to sign in</Link>
        </div>
      ) : (
        <form className="form" onSubmit={submit} noValidate>
          <h3>Forgot password</h3>
          <p className="sub">Enter your staff email and we will send you a link to choose a new password.</p>
          <div className="fields" style={{ gridTemplateColumns: "1fr", marginTop: 16 }}>
            <label className="field">Email
              <input name="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required
                className={bad} aria-invalid={!!bad} />
              {bad && <span className="err">{error.message}</span>}
            </label>
          </div>
          {error && !error.field && <div className="alert-bad" role="alert">{error.message}</div>}
          <button type="submit" className="btn primary" style={{ width: "100%", marginTop: 22 }} disabled={busy}>
            {busy ? "Sending…" : <>Send reset link <Icon name="arrow" size={16} stroke={2.5} /></>}
          </button>
          <p style={{ textAlign: "center", margin: "16px 0 0", fontSize: 14 }}><Link to="/login">Back to sign in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
