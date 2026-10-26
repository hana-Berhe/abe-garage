import { useState } from "react";
import { usePublicServices } from "../useGarage";
import websiteApi from "../website.api";
import Icon from "../../../shared/components/Icon";

const EMPTY = { full_name: "", phone: "", car: "", service_id: "", problem: "", best_time: "any", website: "" };

// The "Request a call back" form. It replaces online booking: the request goes to the
// Call-backs list in the staff app, and the desk phones the customer with a price.
export default function CallbackForm({ id = "callback" }) {
  const { services } = usePublicServices();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);

  const change = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(null); };
  const bad = (name) => (error?.field === name ? "bad" : undefined);
  const say = (name) => error?.field === name && <span className="err">{error.message}</span>;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await websiteApi.requestCallback({ ...form, service_id: form.service_id || null });
      setSent(form.full_name.trim().split(" ")[0]);
      setForm(EMPTY);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (sent !== null) {
    return (
      <div className="form form-ok" id={id} role="status">
        <span className="tick"><Icon name="check" size={26} stroke={3} /></span>
        <h3>Thank you{sent ? `, ${sent}` : ""}. We will call you back.</h3>
        <p>Your request is with our front desk. We usually call back the same working day. Nothing is booked until we speak.</p>
        <button type="button" className="btn ghost" onClick={() => setSent(null)}>Send another request</button>
      </div>
    );
  }

  return (
    <form className="form" id={id} onSubmit={submit} noValidate>
      <h3>Request a call back</h3>
      <p className="sub">Tell us about your car. We call you back with a price, usually within the same working day. Nothing is booked until we speak.</p>
      <div className="fields">
        <label className="field">Full name
          <input name="full_name" type="text" placeholder="Your name" autoComplete="name" required maxLength={100}
            value={form.full_name} onChange={change} className={bad("full_name")} aria-invalid={!!bad("full_name")} />
          {say("full_name")}
        </label>
        <label className="field">Phone number
          <input name="phone" type="tel" placeholder="Your phone" autoComplete="tel" required maxLength={30}
            value={form.phone} onChange={change} className={bad("phone")} aria-invalid={!!bad("phone")} />
          {say("phone")}
        </label>
        <label className="field full">Your car
          <input name="car" type="text" placeholder="Year, make and model, e.g. 2017 Honda Fit" maxLength={120}
            value={form.car} onChange={change} className={bad("car")} />
          {say("car")}
        </label>
        <label className="field full">What do you need?
          <select name="service_id" value={form.service_id} onChange={change} className={bad("service_id")}>
            <option value="">Not sure, please advise</option>
            {(services || []).map((s) => <option key={s.service_id} value={s.service_id}>{s.name}</option>)}
          </select>
          {say("service_id")}
        </label>
        <label className="field full">What seems to be wrong?
          <textarea name="problem" placeholder="Briefly describe the problem" maxLength={1000}
            value={form.problem} onChange={change} className={bad("problem")} />
          {say("problem")}
        </label>
        <label className="field full">Best time to call
          <select name="best_time" value={form.best_time} onChange={change} className={bad("best_time")}>
            <option value="any">Any time</option>
            <option value="morning">Morning, from 8:00 AM</option>
            <option value="afternoon">Afternoon</option>
          </select>
          {say("best_time")}
        </label>
        {/* Left empty by people. Robots fill it in, and the server then ignores the request. */}
        <label className="hp" aria-hidden="true">Website
          <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={change} />
        </label>
      </div>
      {error && !error.field && <div className="alert-bad" role="alert">{error.message}</div>}
      <button type="submit" className="btn primary" disabled={busy}>
        {busy ? "Sending…" : <>Request a call back <Icon name="up" size={16} stroke={2.5} /></>}
      </button>
      <p className="note"><Icon name="info" size={16} /><span>Your request goes straight to our front desk. We only use your details to call you about your car.</span></p>
    </form>
  );
}
