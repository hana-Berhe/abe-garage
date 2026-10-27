import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import Icon from "../../../shared/components/Icon";
import { hour12 } from "../../../shared/lib/format";
import garageArt from "../../../assets/garage.svg";

const PROMISES = [
  ["message", "Plain talk", "We explain what is wrong in words that make sense, and show you the old parts if you want."],
  ["shield", "Your OK first", "We call before any extra work. If you say no, we do not do it."],
  ["file", "Clear invoice", "Every job ends with a printed invoice that lists each piece of work."],
];

export default function About() {
  const g = useGarage();
  const { services } = usePublicServices();
  const opens = g.opening_time ? hour12(g.opening_time).replace(" AM", "").replace(" PM", "") : "8:00";
  return (
    <>
      <PageHero crumb="About us" title="About us">
        <p>We are a small, hands-on team fixing everyday cars. We keep it simple: find the real problem, explain it clearly, and only do the work you agree to.</p>
      </PageHero>

      <section className="section white">
        <div className="wrap split">
          <div className="art">
            <img src={garageArt} alt="Drawing of the garage front" />
            {g.address && <span className="cap">{g.address.toUpperCase()}</span>}
          </div>
          <div>
            <div className="eyebrow">Our story</div>
            <h2 className="h2">Built on one simple rule: ask first</h2>
            <p className="lead">We service, check and repair all makes of car, from a quick oil change to finding the cause of a warning light. Since day one, we have called customers before any extra work, so the bill at the end is never a surprise.</p>
            <div className="stats">
              <div><b>{services ? services.length : "–"}</b>Services we offer</div>
              <div><b>1</b>Named mechanic for each job</div>
              <div><b>{opens}</b>We open, every working day</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="shead"><h2 className="h2">How we work with you</h2></div>
          <div className="services">
            {PROMISES.map(([icon, t, p]) => (
              <article key={t} className="service">
                <small className="kicker">Our promise</small>
                <h3>{t}</h3>
                <p>{p}</p>
                <div className="service-foot"><span /><span className="sicon"><Icon name={icon} size={44} stroke={1.2} /></span></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CallBand title="Come and meet us." text={`Drop in from ${hour12(g.opening_time || "08:00")}, or call us.`} />
    </>
  );
}
