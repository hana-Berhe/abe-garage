import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import CallUs from "../components/CallUs";
import { duration } from "../components/ServiceCard";
import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";
import { hour12 } from "../../../shared/lib/format";

const STEPS = [
  ["Tell us", "Call us or drop in. Tell us what the car is doing."],
  ["We check it", "Bring the car in. A mechanic finds the cause."],
  ["You decide", "We call you with the price. Work starts only after you say yes."],
  ["Pick up and pay", "We tell you when it is ready. Pay cash at the desk and get your invoice."],
];

const FAQ = [
  ["How much will my repair cost?", "Every car is different, so we do not list prices on the website. Call us or drop in. Once we have checked your car, we tell you the price before any work starts."],
  ["Do I need an appointment?", "No booking is needed. Call us and we will agree a time with you. You can also drive in during opening hours."],
  ["What if you find more problems?", "We stop and call you first. We explain what we found and the price. Nothing extra is done unless you say yes."],
  ["How do I pay?", "Cash only, at the front desk when you pick up your car. You get a printed invoice."],
  ["Can I see how the repair is going?", "Yes. When you drop off your car we email you a private link that shows each step of the work."],
  ["Do I pay before the work?", "No. You say yes to the price first, and pay once, when you collect the car."],
];

// FR-WEB-02: the live list of services. No prices here: customers hear theirs from the desk.
export default function Services() {
  const g = useGarage();
  const { services, error } = usePublicServices();
  const opens = g.opening_time ? hour12(g.opening_time) : "8:00 AM";

  return (
    <>
      <PageHero crumb="Services" eyebrow="Our services" title={<>Repairs and servicing,<br /><em>done right.</em></>}>
        <p>What we do every day. Not sure which one you need? Tell us what the car is doing and we will work it out together.</p>
        <div className="actions">
          <CallUs label={g.phone ? `Call ${g.phone}` : "Call us"} />
        </div>
      </PageHero>

      <section className="section on-light">
        <div className="wrap">
          {error && <div className="alert-bad" role="alert" style={{ marginBottom: 20 }}>{error}</div>}
          <div className="services wide">
            {(services || []).map((s, i) => (
              <article key={s.service_id} className="service" id={`service-${s.service_id}`}>
                <div className="row-top">
                  <div className="sicon"><Icon name={SERVICE_ICONS[i % SERVICE_ICONS.length]} size={26} /></div>
                  <div><h3>{s.name}</h3>{s.description && <p>{s.description}</p>}</div>
                </div>
                <div className="meta">
                  <span><Icon name="clock" size={16} />{duration(s.labor_hours) || "Depends on the fault"}</span>
                  <CallUs className="more" label="Call for a price" />
                </div>
              </article>
            ))}
          </div>
          {services && services.length === 0 && <p className="lead">Our service list is coming soon.</p>}
        </div>
      </section>

      <section className="section dk-sec">
        <div className="wrap">
          <div className="shead left">
            <div className="eyebrow">How it works</div>
            <h2 className="h2">A clear price, <em>before</em> any work.</h2>
            <p className="lead">We never start a repair you have not agreed to. This is how every job goes. Bring the car in from {opens}.</p>
          </div>
          <div className="steps">
            {STEPS.map(([t, p], i) => <div key={t} className={`step${i === 0 ? " on" : ""}`}><h3>{t}</h3><p>{p}</p></div>)}
          </div>
        </div>
      </section>

      <section className="section on-light">
        <div className="wrap">
          <div className="shead"><div className="eyebrow">Good to know</div><h2 className="h2">Common questions</h2></div>
          <div className="faq">
            {FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      <CallBand title="Not sure what your car needs?" text="Call us and describe the problem. We give you advice and a price." />
    </>
  );
}
