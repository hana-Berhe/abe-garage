import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import ServiceCard from "../components/ServiceCard";
import Alert from "../../../shared/components/Alert";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";

const FAQ = [
  ["Do I have to pay before the work?", "No. You approve the estimate first, and you pay when you collect the car."],
  ["Can I pay by card or transfer?", "Not yet. We take cash at the desk, in one payment."],
  ["What if you find more work?", "We stop, call you with the new price and only continue if you say yes."],
  ["How do I know how the repair is going?", "We email you a private link to your order. It shows each job and when the car is ready."],
];

// FR-WEB-02, FR-SRV-04: the live price list.
export default function Services() {
  const g = useGarage();
  const { services, error } = usePublicServices();
  return (
    <>
      <PageHero crumb="Services" title="Services and clear prices">
        <p>The same prices we use at the desk. Your estimate copies them in, adds 15% VAT, and that total is what you pay.</p>
        <div className="pill-ticks">
          <span><Icon name="check" size={14} stroke={3} />Prices before VAT</span>
          <span><Icon name="check" size={14} stroke={3} />15% VAT added to the subtotal</span>
          <span><Icon name="check" size={14} stroke={3} />Cash payment at pickup</span>
        </div>
      </PageHero>

      <section className="site-section">
        <div className="site-wrap">
          <Alert>{error}</Alert>
          <div className="card-grid card-grid--2">
            {(services || []).map((s, i) => <ServiceCard key={s.service_id} service={s} index={i} large />)}
          </div>
          {services && services.length === 0 && <p className="lead-muted">Our price list is coming soon.</p>}
        </div>
      </section>

      <section className="site-section site-section--alt">
        <div className="site-wrap split">
          <div>
            <span className="eyebrow">How your bill is worked out</span>
            <h2 className="h-section">No hidden extras</h2>
            <ul className="check-list mt-4">
              <li><Icon name="check" size={18} stroke={3} />We add up the jobs, then add 15% VAT on top of that subtotal.</li>
              <li><Icon name="check" size={18} stroke={3} />Parts we fit are listed on their own line with their price.</li>
              <li><Icon name="check" size={18} stroke={3} />If we find more work, you get a new estimate to approve first.</li>
            </ul>
          </div>
          <div className="estimate-card" aria-label="Example estimate">
            <div className="estimate-card__head"><strong>Example estimate</strong><span>Order 102</span></div>
            <div className="estimate-card__body">
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Oil change</span><span className="money">$50.00</span></div>
              <div className="d-flex justify-content-between py-2 border-bottom"><span>Brakes</span><span className="money">$180.00</span></div>
              <div className="d-flex justify-content-between pt-3"><span className="text-muted">Subtotal</span><span className="money">$230.00</span></div>
              <div className="d-flex justify-content-between pt-1"><span className="text-muted">VAT 15% of subtotal</span><span className="money">$34.50</span></div>
              <div className="d-flex justify-content-between pt-2 mt-2 border-top fs-5 fw-bold"><span>Total</span><span className="money">$264.50</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="site-section">
        <div className="site-wrap split align-items-start">
          <div>
            <span className="eyebrow">Questions</span>
            <h2 className="h-section">Good to know</h2>
            {g.phone && <p className="lead-muted mt-3">Something else on your mind? Call the desk on <a href={telHref(g.phone)}>{g.phone}</a>.</p>}
          </div>
          <div className="faq">
            {FAQ.map(([q, a]) => (
              <details key={q}><summary>{q}</summary><p>{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <CallBand title="Not sure what your car needs?" text="Start with an engine check and a priced plan." />
    </>
  );
}
