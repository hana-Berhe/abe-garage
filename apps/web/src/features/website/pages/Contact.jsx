import { Link } from "react-router-dom";
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
      <PageHero crumb="Contact" title={<>Call, or just <span className="text-yellow">drive in</span></>}>
        <p>Bring your car during opening hours, or call first and we will tell you when we can look at it.</p>
      </PageHero>

      <section className="sec sec--paper">
        <div className="site-wrap">
          <div className="contact-tiles">
            <a href={g.phone ? telHref(g.phone) : undefined} className="tile tile--yellow">
              <span className="sq sq--white"><Icon name="phone" size={26} /></span>
              <small>Call the desk</small>
              <h3 className="d">{g.phone || "–"}</h3>
            </a>
            <a href={mapsUrl || undefined} target="_blank" rel="noreferrer" className="tile">
              <span className="sq"><Icon name="pin" size={26} /></span>
              <small>Address</small>
              <h3 className="d">{g.address || "–"}</h3>
            </a>
            <div className="tile">
              <span className="sq"><Icon name="clock" size={26} /></span>
              <small>Opening hours</small>
              <h3 className="d">{opens ? `${opens}${closes ? ` to ${closes}` : ""}` : "–"}</h3>
            </div>
            <a href={g.email ? `mailto:${g.email}` : undefined} className="tile">
              <span className="sq"><Icon name="mail" size={26} /></span>
              <small>Email</small>
              <span className="email">{g.email || "–"}</span>
            </a>
          </div>

          <div className="d-flex flex-wrap align-items-stretch" style={{ gap: 48, marginTop: 64 }}>
            <div className="map-box" style={{ flex: "1.2 1 420px", minWidth: 0 }}>
              <div className="map-box__pin">
                <span>{g.name || "Abe Garage"}</span>
                <Icon name="pin" size={36} stroke={2.5} />
              </div>
              {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="site-btn site-btn--ink map-box__link">Open in maps</a>}
            </div>
            <div className="stack" style={{ flex: "1 1 360px", minWidth: 0 }}>
              <span className="tag">Already dropped off your car?</span>
              <h2 className="d h-section">Check your email</h2>
              <p className="muted m-0 fs-5">We send a private link to every customer when the price is ready. Open it to see each job and when your car is ready to collect. Lost the email? Call the desk and we will send it again.</p>
              <Link to="/#live-status" className="site-btn site-btn--ink align-self-start">Check my car</Link>
              <div className="info-list">
                <div><span>Payment</span><strong>Cash at pickup, in one payment</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
