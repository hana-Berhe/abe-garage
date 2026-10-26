import { useGarage } from "../useGarage";
import PageHero from "../components/PageHero";
import Icon from "../../../shared/components/Icon";
import { hour12, telHref } from "../../../shared/lib/format";

export default function Contact() {
  const g = useGarage();
  const opens = g.opening_time ? hour12(g.opening_time) : null;
  const closes = g.closing_time ? hour12(g.closing_time) : null;
  const mapsUrl = g.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}` : null;

  return (
    <>
      <PageHero crumb="Contact" title="Come by, or call the desk">
        <p>Bring your car in during opening hours, or call first and we will tell you when we can look at it.</p>
      </PageHero>

      <section className="site-section pt-0">
        <div className="site-wrap contact-cards">
          <article className="contact-card">
            <span className="icon-tile icon-tile--sm"><Icon name="pin" size={22} /></span>
            <h3>Visit</h3>
            <p>{g.address || "–"}</p>
            {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="fw-semibold">Get directions</a>}
          </article>
          <article className="contact-card">
            <span className="icon-tile icon-tile--sm"><Icon name="phone" size={22} /></span>
            <h3>Call</h3>
            <p>{g.phone || "–"}</p>
            {g.phone && <a href={telHref(g.phone)} className="fw-semibold">Call now</a>}
          </article>
          <article className="contact-card">
            <span className="icon-tile icon-tile--sm"><Icon name="mail" size={22} /></span>
            <h3>Email</h3>
            <p>{g.email || "–"}</p>
            {g.email && <a href={`mailto:${g.email}`} className="fw-semibold">Send an email</a>}
          </article>
          <article className="contact-card contact-card--dark">
            <span className="icon-tile icon-tile--sm icon-tile--dark"><Icon name="clock" size={22} /></span>
            <h3>Opening hours</h3>
            <p>{opens ? `Doors open at ${opens}` : "–"}</p>
            {closes && <p>Closes at {closes}</p>}
          </article>
        </div>
      </section>

      <section className="site-section pt-0">
        <div className="site-wrap split align-items-start">
          <div>
            <span className="eyebrow">Opening hours</span>
            <h2 className="h-section mb-4">When to find us</h2>
            <div className="hours-table">
              <div><span>Opening hours</span><strong>{opens ? `${opens}${closes ? ` to ${closes}` : ""}` : "–"}</strong></div>
              {closes && <div><span>Car pickup</span><strong>Until {closes}</strong></div>}
              <div><span>Payment</span><strong>Cash at the desk</strong></div>
            </div>
            <div className="note-box mt-4">
              <Icon name="message" size={22} />
              <div>
                <strong className="d-block">Car already with us?</strong>
                Open the private link in your email to see how the repair is going. Lost it? Call the desk and we will send it again.
              </div>
            </div>
          </div>
          <div className="map-box">
            <span className="map-box__pin"><Icon name="pin" size={18} />{g.name || "Abe Garage"}</span>
            {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="btn btn-white map-box__link">Open in maps</a>}
          </div>
        </div>
      </section>
    </>
  );
}
