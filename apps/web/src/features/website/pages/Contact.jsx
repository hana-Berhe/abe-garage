import { useGarage } from "../useGarage";
import PageHero from "../components/PageHero";
import CallbackForm from "../components/CallbackForm";
import Icon from "../../../shared/components/Icon";
import { hour12, telHref } from "../../../shared/lib/format";
import mapArt from "../../../assets/map.svg";

function InfoCard({ icon, label, value, href, note }) {
  return (
    <div className="icard">
      <div className="sicon"><Icon name={icon} size={22} /></div>
      <div>
        <small>{label}</small>
        <strong>{href ? <a href={href}>{value}</a> : value}</strong>
        <span>{note}</span>
      </div>
    </div>
  );
}

export default function Contact() {
  const g = useGarage();
  const opens = g.opening_time ? hour12(g.opening_time) : "8:00 AM";
  const mapsUrl = g.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.address)}` : null;

  return (
    <>
      <PageHero crumb="Contact" eyebrow="Contact" title={<>Call us, or let<br /><em>us call you.</em></>}>
        <p>There is no online booking. Leave your number and what the car is doing, and we call you back with a price and a time that suits you.</p>
      </PageHero>

      <section className="section on-light" style={{ paddingTop: 64 }}>
        <div className="wrap icards">
          {g.phone && <InfoCard icon="phone" label="Call us" value={g.phone} href={telHref(g.phone)} note="Fastest way to reach us" />}
          {g.address && <InfoCard icon="pin" label="Visit" value={g.address} note="Walk-ins welcome" />}
          <InfoCard icon="clock" label="Opening hours" value={`Opens ${opens}`} note={g.closing_time ? `Closes ${hour12(g.closing_time)}` : "Every working day"} />
          {g.email && <InfoCard icon="mail" label="Email" value={g.email} href={`mailto:${g.email}`} note="We reply the same working day" />}
        </div>

        <div className="wrap contact-grid" style={{ marginTop: 48, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <a className="map" href={mapsUrl || undefined} target="_blank" rel="noreferrer" aria-label="Open the garage location in maps">
              <img src={mapArt} alt="Map showing where the garage is" />
            </a>
            <div className="next">
              <div className="eyebrow">What happens next</div>
              <div className="steps">
                <div className="step on"><h3>We get your request</h3><p>It goes straight to our front desk.</p></div>
                <div className="step"><h3>We call you back</h3><p>Usually the same working day, from {opens}.</p></div>
                <div className="step"><h3>We agree a price and a time</h3><p>Nothing is booked until we have spoken.</p></div>
              </div>
            </div>
          </div>
          <div className="form-wrap"><CallbackForm id="callback" /></div>
        </div>
      </section>
    </>
  );
}
