import { useEffect, useState } from "react";
import settingsService from "../settings.api";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";

export default function Settings() {
  const [form, setForm] = useState(null);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    settingsService.get().then((s) => setForm({ ...s, address: s.address || "", phone: s.phone || "", email: s.email || "" })).catch(setError);
  }, []);

  const change = (e) => {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const s = await settingsService.update(form);
      setForm({ ...s, address: s.address || "", phone: s.phone || "", email: s.email || "" });
      setSaved(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const fieldError = (name) => (error?.field === name ? error.message : null);
  if (!form) return <Alert>{error?.message}</Alert>;

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 className="page-title">Garage settings</h1>
      <p className="text-muted small">These details print on estimates, invoices and emails. A new VAT rate applies to new orders only.</p>
      <Alert>{error && !error.field ? error.message : null}</Alert>
      <Alert kind="success">{saved ? "Settings saved." : null}</Alert>
      <form onSubmit={submit} noValidate>
        <Field label="Garage name" name="name" value={form.name} onChange={change} error={fieldError("name")} />
        <Field label="Address" name="address" value={form.address} onChange={change} error={fieldError("address")} />
        <Field label="Phone" name="phone" value={form.phone} onChange={change} error={fieldError("phone")} />
        <Field label="Email" name="email" type="email" value={form.email} onChange={change} error={fieldError("email")} />
        <Field label="VAT rate (%)" name="vat_rate" type="number" step="0.01" min="0" max="100" value={form.vat_rate} onChange={change} error={fieldError("vat_rate")} />
        <button type="submit" className="btn btn-brand" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
      </form>
    </div>
  );
}
