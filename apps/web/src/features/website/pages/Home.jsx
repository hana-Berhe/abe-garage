import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGarage, usePublicServices } from "../useGarage";
import { reviewsToShow } from "../reviews";
import ServiceCard from "../components/ServiceCard";
import Icon from "../../../shared/components/Icon";
import { hour12, telHref } from "../../../shared/lib/format";
import heroArt from "../../../assets/hero-y.svg";

const REASONS = [
  ["Experienced mechanics", "Every job has one named technician who owns it from start to finish."],
  ["Fair, clear prices", "You get the price before we start. The price you agree is the price you pay."],
  ["We ask before extra work", "Found something else? We stop and call you with a new price first."],
  ["Follow your car live", "A private link by email shows each job as it starts and finishes."],
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
        <button type="submit" className="btn btn-ink">Check</button>
      </div>
      {error && <div className="text-danger small mt-1">{error}</div>}
    </form>
  );
}

function Reviews() {
  const { reviews, rating, samples } = reviewsToShow();
  if (!reviews.length) return null;
  return (
    <section id="reviews" className="sec sec--alt">
      <div className="site-wrap">
        <div className="sec-head">
          <div><span className="tag">Reviews</span><h2 className="d h-section">What customers say</h2></div>
          {rating && (
            <div className="review-score">
              <span className="d">{rating.rating}</span>
              <span><span className="stars d-block" aria-label="5 stars">★★★★★</span><span className="muted small">from {rating.count} reviews</span></span>
            </div>
          )}
        </div>
        <div className="reviews">
          {reviews.map((r, i) => (
            <figure key={i} className={`review${i === 1 ? " review--dark" : ""}`}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="stars" aria-label="5 stars">★★★★★</span>
                {samples && <span className="sample-label">Sample · replace</span>}
              </div>
              <blockquote>“{r.text}”</blockquote>
              <figcaption>
                <span className="review__avatar" aria-hidden="true">{(r.name.replace(/\W/g, "")[0] || "?").toUpperCase()}</span>
                <span><strong className="d-block">{r.name}</strong><small>{r.job}</small></span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const g = useGarage();
  const { services } = usePublicServices();
  const mapsUrl = g.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}` : "/contact";

  return (
    <>
      <section className="site-hero">
        <div className="site-wrap site-hero__inner">
          <div className="site-hero__text">
            <span className="tag">Local · Independent · Honest prices</span>
            <h1 className="d">Your <span className="text-yellow">trusted</span><br />auto repair<br />partner</h1>
            <p>Real mechanics, fair prices and no surprises. You get a written price before we start, and a private link to follow your car while we work.</p>
            <div className="d-flex flex-wrap gap-3">
              {g.phone && <a href={telHref(g.phone)} className="site-btn site-btn--yellow"><Icon name="phone" size={20} />Call for a price</a>}
              <Link to="/services" className="site-btn site-btn--ghost">See our services</Link>
            </div>
          </div>
          <div className="site-hero__art">
            <div className="art-frame"><img src={heroArt} alt="A red hatchback raised on a lift in the Abe Garage workshop" /></div>
            <div className="hero-stamp" aria-hidden="true">Price<br />first,<br />always</div>
            <div className="hero-toast" aria-hidden="true">
              <span className="hero-toast__icon"><Icon name="check" size={22} stroke={3} /></span>
              <span><small>JOB 102 · 09:40</small><strong>Oil change done</strong></span>
            </div>
          </div>
        </div>
        <div className="hazard" />
      </section>

      <section className="sec sec--paper">
        <div className="site-wrap">
          <div className="sec-head">
            <div><span className="tag">Services</span><h2 className="d h-section">What we fix</h2></div>
            <p>Call the desk for a price. We tell you before any work starts, and nothing changes after you say yes.</p>
          </div>
          <div className="tiles">
            {(services || []).slice(0, 4).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} />)}
          </div>
          {services && services.length === 0 && <p className="muted">Our service list is coming soon.</p>}
        </div>
      </section>

      <section className="sec sec--dark">
        <div className="site-wrap d-flex flex-wrap" style={{ gap: 64 }}>
          <div className="stack" style={{ flex: "1 1 380px", minWidth: 0 }}>
            <span className="tag">Why Abe Garage</span>
            <h2 className="d h-section">Why drivers<br />choose <span className="text-yellow">us</span></h2>
            <p className="lead-dark">We are a small, independent workshop. No sales targets, no upselling, no fine print. Just the job you agreed to, done right.</p>
            <div className="why-rule"><small>Our one rule</small><strong>No work starts until you know the price and say yes.</strong></div>
          </div>
          <div className="why-grid" style={{ flex: "1.4 1 520px", minWidth: 0 }}>
            {REASONS.map(([title, text], i) => (
              <div key={title}><span className="d">0{i + 1}</span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <Reviews />

      <section id="live-status" className="sec sec--yellow">
        <div className="site-wrap split">
          <div className="stack" style={{ flexGrow: 1.2 }}>
            <span className="mono fw-bold small" style={{ letterSpacing: "0.12em" }}>NO APP · NO ACCOUNT</span>
            <h2 className="d h-section">Your car, live on your phone</h2>
            <p className="m-0 fs-5" style={{ maxWidth: 520 }}>When we write your price, we email you a private link. Open it any time to see what is done and what is next.</p>
            <div style={{ maxWidth: 480 }}><CheckMyCar /></div>
          </div>
          <div aria-hidden="true">
            <div className="phone-mock">
              <div className="phone-mock__screen">
                <div className="phone-mock__bar"><span className="mark"><Icon name="wrench" size={16} /></span><span className="d fs-4">Abe Garage</span></div>
                <div className="phone-mock__body">
                  <div><span className="mono muted" style={{ fontSize: 11 }}>ORDER 102 · DEMO-101</span><div className="d" style={{ fontSize: 30 }}>Being repaired</div></div>
                  <div className="meter"><span style={{ width: "62%" }} /></div>
                  <div className="phone-mock__row"><span>Oil change</span><strong className="job-state--2">Done</strong></div>
                  <div className="phone-mock__row"><span>Brakes</span><strong className="job-state--1">Working on it</strong></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec sec--paper">
        <div className="site-wrap d-flex flex-wrap align-items-stretch" style={{ gap: 48 }}>
          <div className="stack" style={{ flex: "1 1 400px", minWidth: 0 }}>
            <span className="tag">Contact and location</span>
            <h2 className="d h-section">Come see us</h2>
            {g.phone && <a href={telHref(g.phone)} className="d big-phone">{g.phone}</a>}
            <div className="info-list">
              <div><span>Address</span><strong>{g.address || "–"}</strong></div>
              <div><span>Hours</span><strong>{g.opening_time ? `${hour12(g.opening_time)}${g.closing_time ? ` to ${hour12(g.closing_time)}` : ""}` : "–"}</strong></div>
              <div><span>Email</span><strong>{g.email || "–"}</strong></div>
              <div><span>Payment</span><strong>Cash at pickup</strong></div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {g.phone && <a href={telHref(g.phone)} className="site-btn site-btn--ink">Call us</a>}
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="site-btn site-btn--outline">Get directions</a>
            </div>
          </div>
          <div className="map-box" style={{ flex: "1.3 1 460px", minWidth: 0 }}>
            <div className="map-box__pin">
              <span>{g.name || "Abe Garage"}</span>
              <Icon name="pin" size={36} stroke={2.5} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
