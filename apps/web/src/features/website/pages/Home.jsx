import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGarage, usePublicServices } from "../useGarage";
import ServiceCard from "../components/ServiceCard";
import CallBand from "../components/CallBand";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";
import heroArt from "../../../assets/hero-lift.svg";
import garageArt from "../../../assets/garage-front.svg";

const PROMISES = [
  ["file", "Written estimate", "Every job priced before work."],
  ["shield", "Your approval first", "Extra work? We ask again."],
  ["mail", "Status by email", "Follow your car, no login."],
  ["cash", "Pay cash at pickup", "Printed bill, VAT shown."],
];

const STEPS = [
  ["Bring your car", "We take your details, look at the car and tell you what it needs."],
  ["Get the price and say yes", "Each job, the subtotal, 15% VAT and the total. Nothing starts until you agree, in person or by phone."],
  ["Follow the repair", "A private link by email shows each job as it starts and finishes."],
  ["Pay and drive away", "Pick up your car with a printed bill. Payment is cash at the desk."],
];

// FR-WEB-03: a customer pastes the code (or the whole link) from their email.
function CheckMyCar() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const submit = (e) => {
    e.preventDefault();
    const match = /([a-f0-9]{32})\s*$/i.exec(code.trim());
    if (!match) return setError("Paste the 32-character code or the whole link from your email.");
    navigate(`/order-status/${match[1].toLowerCase()}`);
  };
  return (
    <form onSubmit={submit} className="check-car" noValidate>
      <label htmlFor="check-code" className="form-label fw-bold">Car already with us? Check how it is going</label>
      <div className="d-flex gap-2">
        <input id="check-code" className={`form-control${error ? " is-invalid" : ""}`} placeholder="Code or link from your email" value={code} onChange={(e) => { setCode(e.target.value); setError(null); }} />
        <button type="submit" className="btn btn-dark-navy">Check</button>
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </form>
  );
}

export default function Home() {
  const g = useGarage();
  const { services } = usePublicServices();

  return (
    <>
      <section className="site-hero">
        <div className="site-wrap site-hero__inner">
          <div className="site-hero__text">
            <span className="eyebrow">Car repair you can follow</span>
            <h1>Know the price <span className="accent">before</span> we touch your car.</h1>
            <p>A written estimate first. Work starts only when you say yes. A private link to follow the repair, and a clear bill with 15% VAT shown.</p>
            <div className="d-flex flex-wrap gap-2">
              <Link to="/services" className="btn btn-brand btn-lg-site">See services and prices <Icon name="arrow" size={18} /></Link>
              {g.phone && <a href={telHref(g.phone)} className="btn btn-ghost-light btn-lg-site"><Icon name="phone" size={18} />Call {g.phone}</a>}
            </div>
            <div className="ticks">
              <span><Icon name="check" size={18} stroke={3} />No work without your yes</span>
              <span><Icon name="check" size={18} stroke={3} />Prices on the website</span>
            </div>
          </div>
          <div className="site-hero__art">
            <img src={heroArt} alt="A car on a lift in the workshop" />
            <div className="hero-toast" aria-hidden="true">
              <span className="hero-toast__icon"><Icon name="check" size={22} stroke={3} /></span>
              <span><strong className="d-block">Oil change done</strong><small className="text-muted">Shown on the customer's status page</small></span>
            </div>
          </div>
        </div>
      </section>

      <section className="promise-strip">
        <div className="site-wrap promise-strip__grid">
          {PROMISES.map(([icon, title, text]) => (
            <div className="promise" key={title}>
              <span className="icon-tile icon-tile--sm"><Icon name={icon} size={22} /></span>
              <div><strong>{title}</strong><span>{text}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="site-section">
        <div className="site-wrap">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
            <div>
              <span className="eyebrow">Services and prices</span>
              <h2 className="h-section">What we do, and what it costs</h2>
            </div>
            <Link to="/services" className="fw-semibold">All services and prices <Icon name="arrow" size={16} /></Link>
          </div>
          <div className="card-grid">
            {(services || []).slice(0, 4).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} />)}
          </div>
          {services && services.length === 0 && <p className="lead-muted">Our price list is coming soon.</p>}
          <p className="text-muted small mt-3 mb-0">Prices are before VAT. 15% VAT is added to the subtotal on your bill.</p>
        </div>
      </section>

      <section className="site-section site-section--alt">
        <div className="site-wrap split">
          <div>
            <span className="eyebrow">How it works</span>
            <h2 className="h-section">Four steps, no surprises</h2>
            <p className="lead-muted mt-3">From the moment you hand over the keys to the moment you drive away, you know what is happening and what it costs.</p>
            <div className="mt-4" style={{ maxWidth: 480 }}><CheckMyCar /></div>
          </div>
          <ol className="steps">
            {STEPS.map(([title, text], i) => (
              <li key={title}>
                <span className="steps__num">{i + 1}</span>
                <div><strong>{title}</strong><span>{text}</span></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="site-section site-section--dark">
        <div className="site-wrap split">
          <div className="phone-mock" aria-hidden="true">
            <div className="phone-mock__bar"><Icon name="wrench" size={16} />ABE GARAGE</div>
            <div className="p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div><strong className="d-block">Order 102</strong><small className="text-muted">Honda Fit · DEMO-101</small></div>
                <span className="ag-badge ag-badge--3">In progress</span>
              </div>
              <div className="progress-bar-thin my-3"><span style={{ width: "50%" }} /></div>
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Oil change</span><span className="ag-badge ag-badge--4">Done</span></div>
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Brakes</span><span className="ag-badge ag-badge--3">Started</span></div>
              <div className="d-flex justify-content-between pt-3"><span className="text-muted">Total with VAT</span><strong>$264.50</strong></div>
            </div>
          </div>
          <div>
            <span className="eyebrow">Your private status page</span>
            <h2 className="h-section">Follow your car from your phone</h2>
            <p className="lead-muted mt-3">When we write your estimate, we email you a private link. Open it any time to see which jobs are done, what is next and the agreed total. No app, no account, no password.</p>
            <ul className="check-list mt-3">
              <li><Icon name="check" size={18} stroke={3} />See each job start and finish</li>
              <li><Icon name="check" size={18} stroke={3} />Know when the car is ready to collect</li>
              <li><Icon name="check" size={18} stroke={3} />The price you agreed, with VAT</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-wrap split">
          <div>
            <span className="eyebrow">About Abe Garage</span>
            <h2 className="h-section">A local garage that writes everything down</h2>
            <p className="lead-muted mt-3">Every job is priced and written down before we start, and the price you agree is the price on your bill.</p>
            <Link to="/about" className="btn btn-dark-navy btn-lg-site mt-2">More about us</Link>
          </div>
          <div className="art-card"><img src={garageArt} alt="The front of Abe Garage" /></div>
        </div>
      </section>

      <CallBand title="Warning light on? Strange noise?" text="Call the desk and we will book you in." />
    </>
  );
}
