import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import Icon from "../../../shared/components/Icon";
import { hour12 } from "../../../shared/lib/format";
import garageArt from "../../../assets/garage-front.svg";

const PROMISES = [
  ["file", "Price before work", "Every job is written down and priced. You see the subtotal, 15% VAT and the total before we start."],
  ["user", "A named mechanic", "Each job has one technician responsible for it, from start to finish."],
  ["shield", "Old prices stay put", "The price you agreed is the price on your bill, even if our list changes later."],
  ["mail", "You are kept informed", "A private link by email shows how the repair is going. No account needed."],
];

export default function About() {
  const g = useGarage();
  const { services } = usePublicServices();
  return (
    <>
      <PageHero crumb="About" title="The garage that shows its work"
        art={<img src={garageArt} alt="The front of Abe Garage" />}>
        <p>{g.name || "Abe Garage"} is a neighbourhood workshop. We fix cars the way we would want ours fixed: price first, your yes, then the work.</p>
      </PageHero>

      <section className="site-section">
        <div className="site-wrap split">
          <div>
            <span className="eyebrow">Our story</span>
            <h2 className="h-section">Built on one simple rule</h2>
          </div>
          <div className="lead-muted">
            <p>We service, check and repair all makes of car, from a quick oil change to finding the cause of a warning light.</p>
            <p className="mb-0">One rule has not changed: no job starts until the customer knows the price and says yes. If we find something else while the car is on the lift, we stop and ask again.</p>
          </div>
        </div>
        <div className="site-wrap mt-5">
          <div className="stat-row">
            <div><strong>{services ? services.length : "–"}</strong><span>Services at fixed, published prices</span></div>
            <div><strong>15%</strong><span>VAT, shown on every bill</span></div>
            <div><strong>{g.opening_time ? hour12(g.opening_time) : "–"}</strong><span>When the doors open</span></div>
            <div><strong>Cash</strong><span>One payment when you collect the car</span></div>
          </div>
        </div>
      </section>

      <section className="site-section site-section--alt">
        <div className="site-wrap">
          <span className="eyebrow">Our promise</span>
          <h2 className="h-section mb-4">What you can count on</h2>
          <div className="card-grid">
            {PROMISES.map(([icon, title, text]) => (
              <article className="site-card" key={title}>
                <span className="icon-tile icon-tile--sm"><Icon name={icon} size={22} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CallBand title="See our prices before you visit" text="Every service, the time it takes and what it costs."
        link={{ to: "/services", label: "Services and prices" }} />
    </>
  );
}
