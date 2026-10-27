import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import customerService from "../../customers/customer.api";
import serviceService from "../../services/service.api";
import orderService from "../order.api";
import SearchBox from "../../../shared/components/SearchBox";
import Field from "../../../shared/components/Field";
import Alert from "../../../shared/components/Alert";
import Totals from "../../../shared/components/Totals";
import { previewTotals } from "../../../shared/lib/money";
import { money } from "../../../shared/lib/format";
import Icon from "../../../shared/components/Icon";

const STEPS = ["Customer", "Car", "Services", "Notes and date"];
const VAT_PREVIEW = 15; // preview only; the server uses the rate in settings
// The step whose page shows each field, so a refused save opens that step with the message under the input.
const FIELD_STEP = { vehicle_id: 1, mileage: 1, estimated_ready_date: 3, notes_for_customer: 3, internal_notes: 3 };
const stepOf = (field) => (field?.startsWith("lines") ? 2 : FIELD_STEP[field]);

// FR-ORD-01..04: a new order in 4 steps, with a live subtotal, VAT and total.
export default function NewOrder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [vehicleId, setVehicleId] = useState(null);
  const [mileage, setMileage] = useState("");
  const [services, setServices] = useState([]);
  const [picked, setPicked] = useState({}); // service_id -> custom price or ""
  const [extras, setExtras] = useState([]);
  const [notes, setNotes] = useState({ estimated_ready_date: "", notes_for_customer: "", internal_notes: "" });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // A customer with one car gets that car picked, with its saved mileage filled in.
  const pickCustomer = useCallback((full) => {
    const only = full.vehicles.length === 1 ? full.vehicles[0] : null;
    setCustomer(full);
    setVehicleId(only ? only.vehicle_id : null);
    setMileage(only?.mileage ?? "");
    setStep(1);
  }, []);

  useEffect(() => {
    serviceService.list().then((all) => setServices(all.filter((s) => s.active))).catch((e) => setError(e));
    const preset = params.get("customer");
    if (preset) {
      customerService.get(preset).then(pickCustomer).catch(setError);
    }
  }, [params, pickCustomer]);

  useEffect(() => {
    if (step !== 0) return;
    customerService.list({ search, active: 1 }).then(setCustomers).catch(setError);
  }, [search, step]);

  const onSearch = useCallback((s) => setSearch(s), []);

  const chooseCustomer = async (c) => pickCustomer(await customerService.get(c.customer_id));

  const prices = useMemo(() => {
    const list = services.filter((s) => s.service_id in picked).map((s) => (picked[s.service_id] !== "" ? picked[s.service_id] : s.price));
    return [...list, ...extras.map((x) => x.price)];
  }, [services, picked, extras]);
  const totals = previewTotals(prices, VAT_PREVIEW);

  const toggle = (s) => {
    const next = { ...picked };
    if (s.service_id in next) delete next[s.service_id];
    else next[s.service_id] = "";
    setPicked(next);
  };

  async function submit() {
    setBusy(true);
    setError(null);
    const lines = [
      ...Object.entries(picked).map(([id, price]) => (price !== "" ? { service_id: Number(id), price } : { service_id: Number(id) })),
      ...extras.map((x) => ({ description: x.description, price: x.price })),
    ];
    try {
      const order = await orderService.create({ customer_id: customer.customer_id, vehicle_id: vehicleId, mileage, lines, ...notes });
      navigate(`/admin/order/${order.order_id}`, { state: { created: true, emailSent: order.email_sent } });
    } catch (err) {
      setError(err);
      if (stepOf(err.field) !== undefined) setStep(stepOf(err.field));
    } finally {
      setBusy(false);
    }
  }

  const car = customer?.vehicles.find((v) => v.vehicle_id === vehicleId);
  const canNext = [!!customer, !!vehicleId, prices.length > 0, true][step];
  const fieldError = (n) => (error?.field === n ? error.message : null);

  return (
    <>
      <h1 className="page-title">Create a new order</h1>
      <ol className="steps-bar" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button type="button" className={i < step ? "done" : undefined} disabled={i > step}
              onClick={() => setStep(i)} aria-current={i === step ? "step" : undefined}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      {/* Shown unless the message already sits under an input on this step. */}
      <Alert>{error && (stepOf(error.field) !== step || error.field.startsWith("lines")) ? error.message : null}</Alert>
      <div className="row g-4">
        <div className="col-lg-8">
          {customer && step > 0 && (
            <div className="picked">
              <h3>{customer.first_name} {customer.last_name}</h3>
              <div className="kv-line">Phone number: <span>{customer.phone}</span></div>
              {customer.email && <div className="kv-line">Email: <span>{customer.email}</span></div>}
              <button type="button" className="unpick" aria-label="Choose another customer" title="Choose another customer" onClick={() => setStep(0)}><Icon name="x" size={18} stroke={3} /></button>
            </div>
          )}
          {car && step > 1 && (
            <div className="picked">
              <h3>{car.make} {car.model}</h3>
              <div className="kv-line">Plate: <span>{car.plate}</span></div>
              {car.year && <div className="kv-line">Year: <span>{car.year}</span></div>}
              {mileage !== "" && <div className="kv-line">Mileage today: <span>{mileage} km</span></div>}
              <button type="button" className="unpick" aria-label="Choose another car" title="Choose another car" onClick={() => setStep(1)}><Icon name="x" size={18} stroke={3} /></button>
            </div>
          )}
          {step === 0 && (
            <div className="ag-card">
              <h2 className="h4">Who is the customer?</h2>
              <SearchBox value={search} onSearch={onSearch} placeholder="Search for a customer by first name, last name, email, phone or plate" />
              <Link to="/admin/customer/new" className="btn btn-brand mt-3">Add new customer</Link>
              <div className="list-group mt-3">
                {customers?.rows.map((c) => (
                  <button type="button" key={c.customer_id} className="list-group-item list-group-item-action d-flex justify-content-between" onClick={() => chooseCustomer(c)}>
                    <span><strong>{c.first_name} {c.last_name}</strong> <span className="muted">· {c.phone}</span></span>
                    <span className="muted small">{c.vehicle_count} car(s)</span>
                  </button>
                ))}
                {customers && customers.rows.length === 0 && <p className="muted">No match. Add the customer first from the Customers page.</p>}
              </div>
            </div>
          )}
          {step === 1 && customer && (
            <div className="ag-card">
              <h2 className="h4">Which car?</h2>
              {customer.vehicles.length === 0 && <p className="muted">This customer has no car yet. Add one on their profile.</p>}
              <div className="pick-list mb-3">
                {customer.vehicles.map((v) => (
                  <label key={v.vehicle_id} className={`pick-row${vehicleId === v.vehicle_id ? " on" : ""}`}>
                    <input type="radio" className="form-check-input" name="vehicle" checked={vehicleId === v.vehicle_id}
                      onChange={() => { setVehicleId(v.vehicle_id); setMileage(v.mileage ?? ""); }} />
                    <span className="grow"><b>{v.year} {v.make} {v.model}</b><small>{[v.color, v.mileage != null && `${v.mileage} km`].filter(Boolean).join(" · ")}</small></span>
                    <span className="plate">{v.plate}</span>
                  </label>
                ))}
              </div>
              {fieldError("vehicle_id") && <p className="text-danger">{fieldError("vehicle_id")}</p>}
              {vehicleId && <Field label="Mileage today (km)" name="mileage" type="number" min="0" value={mileage} onChange={(e) => setMileage(e.target.value)} error={fieldError("mileage")} />}
            </div>
          )}
          {step === 2 && (
            <div className="ag-card">
              <h2 className="h4">Choose services</h2>
              <p className="muted small">Prices fill in from the price list. Type a price only to change it for this order.</p>
              <div className="pick-list mb-4">
                {services.map((s) => {
                  const on = s.service_id in picked;
                  return (
                    <div key={s.service_id} className={`pick-row${on ? " on" : ""}`}>
                      <input id={`svc-${s.service_id}`} type="checkbox" className="form-check-input" checked={on} onChange={() => toggle(s)} />
                      <label htmlFor={`svc-${s.service_id}`} className="grow"><b>{s.name}</b><small>{s.description ? `${s.description} · ` : ""}about {Number(s.labor_hours)} h</small></label>
                      {on ? (
                        <input type="number" step="0.01" min="0" className="form-control" style={{ width: 130 }} aria-label={`Price for ${s.name}`}
                          placeholder={s.price} value={picked[s.service_id]} onChange={(e) => setPicked({ ...picked, [s.service_id]: e.target.value })} />
                      ) : (
                        <span className="money">{money(s.price)}</span>
                      )}
                    </div>
                  );
                })}
              </div>
              <h3 className="h5">Extra items (parts)</h3>
              {extras.map((x, i) => (
                <div className="d-flex gap-2 mb-2" key={i}>
                  <input className="form-control" placeholder="Description" aria-label="Extra item description" value={x.description}
                    onChange={(e) => setExtras(extras.map((y, j) => (j === i ? { ...y, description: e.target.value } : y)))} />
                  <input type="number" step="0.01" min="0" className="form-control" style={{ width: 130 }} placeholder="Price" aria-label="Extra item price" value={x.price}
                    onChange={(e) => setExtras(extras.map((y, j) => (j === i ? { ...y, price: e.target.value } : y)))} />
                  <button type="button" className="btn btn-outline-secondary" aria-label="Remove item" onClick={() => setExtras(extras.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button type="button" className="btn btn-outline-secondary" onClick={() => setExtras([...extras, { description: "", price: "" }])}>+ Add extra item</button>
            </div>
          )}
          {step === 3 && (
            <div className="ag-card">
              <h2 className="h4">Notes and date</h2>
              <Field label="Estimated ready date" name="estimated_ready_date" type="date" value={notes.estimated_ready_date}
                onChange={(e) => setNotes({ ...notes, estimated_ready_date: e.target.value })} error={fieldError("estimated_ready_date")} />
              <Field label="Note for the customer (shown on their status page)" name="notes_for_customer" as="textarea" rows={2}
                value={notes.notes_for_customer} onChange={(e) => setNotes({ ...notes, notes_for_customer: e.target.value })} error={fieldError("notes_for_customer")} />
              <Field label="Internal note (office only, technicians don't see it)" name="internal_notes" as="textarea" rows={2}
                value={notes.internal_notes} onChange={(e) => setNotes({ ...notes, internal_notes: e.target.value })} error={fieldError("internal_notes")} />
            </div>
          )}
          <div className="d-flex gap-2 mt-3">
            {step > 0 && <button type="button" className="btn btn-outline-secondary" onClick={() => setStep(step - 1)}>Back</button>}
            {step < 3 && <button type="button" className="btn btn-ink" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</button>}
            {step === 3 && <button type="button" className="btn btn-brand" disabled={busy} onClick={submit}>{busy ? "Saving…" : "Create order and email the link"}</button>}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="ag-card">
            <h2 className="h5">Estimate</h2>
            <p className="mb-1">{customer ? `${customer.first_name} ${customer.last_name}` : <span className="muted">No customer yet</span>}</p>
            <p className="muted small">{car ? `${car.year || ""} ${car.make} ${car.model} · ${car.plate}` : "No car yet"}</p>
            <Totals subtotal={totals.subtotal} vatRate={VAT_PREVIEW} vatAmount={totals.vat_amount} total={totals.total} />
            <p className="muted small mt-2 mb-0">The server checks the prices and the VAT rate when you save.</p>
          </div>
        </div>
      </div>
    </>
  );
}
