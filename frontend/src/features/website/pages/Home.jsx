import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGarage, usePublicServices } from "../useGarage";
import { reviewsToShow } from "../reviews";
import ServiceCard from "../components/ServiceCard";
import CallBand from "../components/CallBand";
import WhyChooseUs from "../components/WhyChooseUs";
import Icon from "../../../shared/components/Icon";
import { hour12, telHref } from "../../../shared/lib/format";
import carArt from "../../../assets/car.svg";
import gearArt from "../../../assets/gear.svg";
import garageArt from "../../../assets/garage.svg";

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
            <div className="eyebrow">Welcome to {g.name || "Abe Garage"}</div>
            <h1>Tune up your car<br />to the next level</h1>
            <p>From engine checks to brake repairs, we keep your car running safely. Call us and tell us what is wrong. We give you a clear price before any work starts.</p>
            {g.phone ? (
              <a className="play" href={telHref(g.phone)}>
                <span className="play-btn"><Icon name="phone" size={22} /></span>
                <span>Call us now<br /><b>{g.phone}</b></span>
              </a>
            ) : (
              <Link className="play" to="/contact">
                <span className="play-btn"><Icon name="arrow" size={22} stroke={2.5} /></span>
                <span>Contact us<br /><b>Find the garage</b></span>
              </Link>
            )}
          </div>
          <div className="hero-visual">
            <img className="car" src={carArt} alt="" />
          </div>
        </div>
      </section>

      <section className="section white">
        <div className="wrap split">
          <div className="art">
            <img src={garageArt} alt="Drawing of the garage front" />
            <div className="art-badge"><b>{opens.replace(/ ?[AP]M$/, "")}</b>{/PM$/.test(opens) ? "PM" : "AM"}<br />We open</div>
          </div>
          <div>
            <div className="eyebrow">Welcome to our workshop</div>
            <h2 className="h2">Honest repairs, a clear price first</h2>
            <p className="lead">We are a local workshop that fixes cars properly and talks to you like a person. No jargon, no pressure, and no work you did not agree to.</p>
            <p className="lead" style={{ marginTop: 14 }}>We call you and wait for your OK before any extra work. You pay in cash at pick-up and get a clear printed invoice.</p>
            <Link to="/about" className="btn primary" style={{ marginTop: 28 }}>About us <Icon name="arrow" size={16} stroke={2.5} /></Link>
          </div>
        </div>
      </section>

      <section className="section" id="services">
        <div className="wrap">
          <div className="shead">
            <h2 className="h2">Our services</h2>
            <p className="lead">Tell us what is wrong and we check it. You get a clear price from us before any work starts.</p>
          </div>
          <div className="services">
            {(services || []).slice(0, 6).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} />)}
          </div>
          {services && services.length === 0 && <p className="lead">Our service list is coming soon.</p>}
        </div>
      </section>

      <section className="quality">
        <div className="quality-red">
          <div className="quality-in">
            <h2>Quality service and customer satisfaction!</h2>
            <p>Every job starts with a proper check. A named mechanic works on your car, and you hear the price before any work starts. When your car is ready, we tell you straight away.</p>
          </div>
        </div>
        <div className="quality-art" aria-hidden="true"><img src={gearArt} alt="" /></div>
      </section>

      <WhyChooseUs services={services} />

      <section className="section dk-sec" id="live-status">
        <div className="wrap split track">
          <div>
            <div className="eyebrow">Track your repair</div>
            <h2 className="h2">Your car, live on your phone</h2>
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
                    <div><span>Oil change</span><span className="pill s2">Done</span></div>
                    <div><span>Brake pads</span><span className="pill s1">Working on it</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Reviews />

      <CallBand title="Something wrong with your car?" text="Call us and tell us what is wrong. We give you a price before any work starts." />
    </>
  );
}
