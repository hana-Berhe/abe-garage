import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import { duration, shortMoney } from "../components/ServiceCard";
import Alert from "../../../shared/components/Alert";
import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";
import { money, telHref } from "../../../shared/lib/format";
import { previewTotals } from "../../../shared/lib/money";

const FAQ = [
  ["Do I pay before the work?", "No. You approve the price first and pay when you collect the car."],
  ["Can I pay by card?", "Not yet. We take cash at the desk, in one payment."],
  ["What if you find more work?", "We stop, call you with the new price and only continue if you say yes."],
  ["How do I know how it is going?", "We email you a private link to your order. It shows each job and when the car is ready."],
];

// FR-WEB-02, FR-SRV-04: the live price list.
export default function Services() {
  const g = useGarage();
  const { services, error } = usePublicServices();
  const vatRate = Number(g.vat_rate ?? 15);
  const withVat = (price) => money(previewTotals([price], vatRate).total);

  return (
    <>
      <PageHero crumb="Services" title={<>Services <span className="text-yellow">&amp;</span> prices</>}
        side={
          <div className="price-rules ms-lg-auto" style={{ maxWidth: 320 }}>
            <div className="mono text-yellow small pt-0">HOW PRICES WORK</div>
            <div><span>Prices shown</span><strong>Before VAT</strong></div>
            <div><span>VAT</span><strong>{vatRate}% of subtotal</strong></div>
            <div><span>Payment</span><strong>Cash at pickup</strong></div>
          </div>
        }>
        <p>The same price list we use at the desk. Your estimate copies these prices, adds {vatRate}% VAT, and that total is what you pay.</p>
      </PageHero>

      <section className="sec sec--paper">
        <div className="site-wrap">
          <Alert>{error}</Alert>
          <div className="service-rows">
            {(services || []).map((s, i) => (
              <article key={s.service_id} className="tile service-row">
                <span className={`sq${i === 0 ? "" : " sq--white"}`}><Icon name={SERVICE_ICONS[i % SERVICE_ICONS.length]} size={28} /></span>
                <div className="service-row__body">
                  <small>{String(i + 1).padStart(2, "0")}{duration(s.labor_hours) ? ` · ${duration(s.labor_hours)}` : ""}</small>
                  <h2 className="d">{s.name}</h2>
                  {s.description && <p>{s.description}</p>}
                </div>
                <div className="service-row__price">
                  <span className="d">{shortMoney(s.price)}</span>
                  <small>Before VAT · {withVat(s.price)} with VAT</small>
                </div>
              </article>
            ))}
          </div>
          {services && services.length === 0 && <p className="muted">Our price list is coming soon.</p>}
        </div>
      </section>

      <section className="sec sec--dark">
        <div className="site-wrap split">
          <div className="stack">
            <span className="tag">Your bill, explained</span>
            <h2 className="d h-section">No hidden <span className="text-yellow">extras</span></h2>
            <p className="lead-dark">We add up the jobs, then add {vatRate}% VAT to that subtotal. Parts get their own line with their own price. If we find more work, you get a new price to approve first.</p>
          </div>
          <div className="receipt" aria-label="Example estimate" style={{ maxWidth: 420, marginLeft: "auto" }}>
            <div className="receipt__head"><span className="d">Estimate</span><span>ORDER 102</span></div>
            <div className="receipt__row"><span>Oil change</span><span>50.00</span></div>
            <div className="receipt__row"><span>Brakes</span><span>180.00</span></div>
            <div className="receipt__row receipt__sub"><span>Subtotal</span><span>230.00</span></div>
            <div className="receipt__row"><span>VAT 15%</span><span>34.50</span></div>
            <div className="receipt__total"><span>TOTAL</span><span className="d">$264.50</span></div>
          </div>
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
