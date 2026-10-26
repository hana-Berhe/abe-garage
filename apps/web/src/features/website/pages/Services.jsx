import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import { duration } from "../components/ServiceCard";
import Alert from "../../../shared/components/Alert";
import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";

const FAQ = [
  ["Do I pay before the work?", "No. You approve the price first and pay when you collect the car."],
  ["Can I pay by card?", "Not yet. We take cash at the desk, in one payment."],
  ["What if you find more work?", "We stop, call you with the new price and only continue if you say yes."],
  ["How do I know how it is going?", "We email you a private link to your order. It shows each job and when the car is ready."],
];

// FR-WEB-02: the live list of services. Prices are not shown here; customers get theirs from the desk.
export default function Services() {
  const g = useGarage();
  const { services, error } = usePublicServices();

  return (
    <>
      <PageHero crumb="Services" title={<>Our <span className="text-yellow">services</span></>}
        side={
          <div className="price-rules ms-lg-auto" style={{ maxWidth: 320 }}>
            <div className="mono text-yellow small pt-0">HOW IT WORKS</div>
            <div><span>Your price</span><strong>Before any work</strong></div>
            <div><span>Extra work</span><strong>Only if you say yes</strong></div>
            <div><span>Payment</span><strong>Cash at pickup</strong></div>
          </div>
        }>
        <p>Call the desk or bring your car in, and we will tell you the price before we start. The price you agree is the price you pay.</p>
      </PageHero>

      <section className="sec sec--paper">
        <div className="site-wrap">
          <Alert>{error}</Alert>
          <div className="service-rows">
            {(services || []).map((s, i) => (
              <article key={s.service_id} className="tile service-row">
                <span className={`sq${i === 0 ? "" : " sq--white"}`}><Icon name={SERVICE_ICONS[i % SERVICE_ICONS.length]} size={28} /></span>
                <div className="service-row__body">
                  <small>{String(i + 1).padStart(2, "0")}</small>
                  <h2 className="d">{s.name}</h2>
                  {s.description && <p>{s.description}</p>}
                </div>
                {duration(s.labor_hours) && (
                  <div className="service-row__price">
                    <small>Takes</small>
                    <span className="d service-row__time">{duration(s.labor_hours).replace("about ", "")}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
          {services && services.length === 0 && <p className="muted">Our service list is coming soon.</p>}
        </div>
      </section>

      <section className="sec sec--alt">
        <div className="site-wrap split align-items-start">
          <div className="stack">
            <span className="tag">Questions</span>
            <h2 className="d h-section">Good to know</h2>
            {g.phone && <p className="muted m-0">Anything else? Call the desk on <a href={telHref(g.phone)} className="fw-bold">{g.phone}</a>.</p>}
          </div>
          <div className="faq">
            {FAQ.map(([q, a], i) => (
              <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <CallBand title="Not sure what it needs?" />
    </>
  );
}
