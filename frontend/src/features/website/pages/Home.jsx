import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGarage, usePublicServices } from "../useGarage";
import { reviewsToShow } from "../reviews";
import ServiceCard from "../components/ServiceCard";
import CallBand from "../components/CallBand";
import CallUs from "../components/CallUs";
import HowItWorks from "../components/HowItWorks";
import { hoursText } from "../../../layouts/Header";
import Icon from "../../../shared/components/Icon";
import { hour12, telHref } from "../../../shared/lib/format";
import carArt from "../../../assets/car.svg";
import gearArt from "../../../assets/gear.svg";

const TRUST = [
  ["gear", "Skilled mechanics", "Engines, brakes, steering and more"],
  ["message", "Clear, plain answers", "You know what your car needs and why"],
  ["mobile", "Follow your car live", "A link shows each step of the repair"],
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
      <label htmlFor="check-code">Car already with us? Check how it is going</label>
      <div className="row-in">
        <input id="check-code" placeholder="Code or link from your email" value={code} aria-invalid={!!error}
          onChange={(e) => { setCode(e.target.value); setError(null); }} />
        <button type="submit" className="btn primary">Check</button>
      </div>
      {error && <div className="err">{error}</div>}
    </form>
  );
}

const Stars = () => (
  <div className="stars" aria-label="5 out of 5 stars">
    {[1, 2, 3, 4, 5].map((i) => (
      <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
      </svg>
    ))}
  </div>
);

function Reviews() {
  const { reviews, rating, samples } = reviewsToShow();
  if (!reviews.length) return null;
  return (
    <section className="section" id="reviews">
      <div className="wrap">
        <div className="shead">
          <div className="eyebrow">Reviews</div>
          <h2 className="h2">What our customers say</h2>
          {rating && <p className="lead">{rating.rating} out of 5, from {rating.count} reviews</p>}
        </div>
        <div className="reviews">
          {reviews.map((r, i) => (
            <article key={i} className="review">
              <Stars />
              {samples && <span className="sample">Sample, replace before launch</span>}
              <q>{r.text}</q>
              <div className="who">
                <span className="av">{r.name.replace(/[^A-Za-z ]/g, "").split(" ").filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?"}</span>
                <div><b>{r.name}</b><small>{r.job}</small></div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const g = useGarage();
  const { services } = usePublicServices();
  const opens = g.opening_time ? hour12(g.opening_time) : "8:00 AM";

  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Your trusted auto repair partner</div>
            <h1>Expert Care.<br /><em>Every Mile.</em></h1>
            <p>From engine checks to brake repairs, {g.name || "Abe Garage"} keeps your car running safely. Call us and tell us what is wrong. We give you a clear price before any work starts.</p>
            <div className="actions">
              <CallUs />
              <Link className="btn outline" to="/services">Explore services <Icon name="arrow" size={16} stroke={2.5} /></Link>
            </div>
            <div className="hero-facts">
              <span><Icon name="clock" size={18} />Opens {opens}</span>
              <span><Icon name="cash" size={18} />Cash payment at pick-up</span>
              {g.phone && <span><Icon name="phone" size={18} /><a href={telHref(g.phone)}>{g.phone}</a></span>}
            </div>
          </div>
          <div className="hero-visual">
            <span className="vertical" aria-hidden="true">BUILT FOR THE ROAD</span>
            <img className="car" src={carArt} alt="" />
            <div className="chip">
              <i><Icon name="shield" size={20} /></i>
              <div><b>No surprise bills</b><small>We ask before any extra work</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust">
        <div className="wrap trust-grid">
          {TRUST.map(([icon, title, text]) => (
            <div key={title} className="trust-item">
              <div className="ticon"><Icon name={icon} size={24} /></div>
              <div><strong>{title}</strong><small>{text}</small></div>
            </div>
          ))}
        </div>
      </section>

      <section className="section on-light" id="services">
        <div className="wrap">
          <div className="shead">
            <div className="eyebrow">What we do</div>
            <h2 className="h2">Mechanical services for<br />everyday driving</h2>
            <p className="lead">Tell us what is wrong and we check it. You get a clear price from us before any work starts.</p>
          </div>
          <div className="services">
            {(services || []).slice(0, 6).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} />)}
          </div>
          {services && services.length === 0 && <p className="lead">Our service list is coming soon.</p>}
        </div>
      </section>

      <section className="section white on-light" id="why">
        <div className="wrap split">
          <div className="art"><img src={gearArt} alt="Drawing of a gear" /><span className="cap">MECHANICAL EXPERTISE</span></div>
          <div>
            <div className="eyebrow">Why drivers choose us</div>
            <h2 className="h2">Real mechanical work.<br />Real peace of mind.</h2>
            <p className="lead">We are a local workshop that fixes cars properly and talks to you like a person. No jargon, no pressure, and no work you did not agree to.</p>
            {[
              "We explain the problem in plain words",
              "We call you and wait for your OK before any extra work",
              "Pay in cash at pick-up, with a clear printed invoice",
              `Open from ${opens}, so you can drop off before work`,
            ].map((t) => <div key={t} className="check"><span><Icon name="check" size={14} stroke={3} /></span>{t}</div>)}
            <Link to="/about" className="btn dark" style={{ marginTop: 14 }}>About the garage <Icon name="arrow" size={16} stroke={2.5} /></Link>
          </div>
        </div>
      </section>

      <section className="section dk-sec" id="live-status">
        <div className="wrap split track">
          <div>
            <div className="eyebrow">Track your repair</div>
            <h2 className="h2">Your car, live on <em>your phone.</em></h2>
            <p className="lead">When you drop off your car, we email you a private link. Open it any time to see what has been done and when your car is ready.</p>
            <div className="steps three" style={{ marginTop: 40 }}>
              <div className="step on"><h3>Drop off</h3><p>We check the car in and note what you told us.</p></div>
              <div className="step"><h3>We call you</h3><p>You hear the price and say yes or no.</p></div>
              <div className="step"><h3>Pick up</h3><p>We tell you when it is ready. Pay cash at the desk.</p></div>
            </div>
            <CheckMyCar />
          </div>
          <div aria-hidden="true">
            <div className="phone">
              <div className="phone-in">
                <div className="phone-top">
                  <div className="meta"><span>Abe Garage</span><span>Order 102</span></div>
                  <b>Your car is being repaired</b>
                  <div className="car">2017 Honda Fit <span className="plate">DEMO-101</span></div>
                </div>
                <div className="phone-body">
                  <ol className="prog mini">
                    <li className="done"><span className="dot"><Icon name="check" size={13} stroke={3} /></span>Checked in at 8:05 AM</li>
                    <li className="done"><span className="dot"><Icon name="check" size={13} stroke={3} /></span>You approved the work</li>
                    <li className="now"><span className="dot" />Being repaired now</li>
                    <li className="todo"><span className="dot" />Ready for pick-up</li>
                  </ol>
                  <div className="phone-jobs">
                    <div><span>Oil change</span><b style={{ color: "#0B6446" }}>Done</b></div>
                    <div><span>Brake pads</span><b style={{ color: "var(--orange-text)" }}>Working on it</b></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reviews />

      <CallBand title="Something wrong with your car?" text="Call us and tell us what is wrong. We give you a price before any work starts." />

      <section className="section dk-sec" id="contact">
        <div className="wrap contact-grid">
          <div>
            <div className="eyebrow">Get in touch</div>
            <h2 className="h2">Let us get you<br />back on the road.</h2>
            <p className="lead">Call us, or just drive in. Walk-ins are welcome from {opens}.</p>
            <div className="info">
              {g.phone && <div><strong>Phone</strong><a href={telHref(g.phone)}>{g.phone}</a></div>}
              {g.address && <div><strong>Address</strong>{g.address}</div>}
              <div><strong>Opening hours</strong>{hoursText(g) || `Opens ${opens}`}</div>
              {g.email && <div><strong>Email</strong><a href={`mailto:${g.email}`}>{g.email}</a></div>}
              <div><strong>Payment</strong>Cash only, at pick-up</div>
            </div>
          </div>
          <HowItWorks opens={opens} />
        </div>
      </section>
    </>
  );
}
