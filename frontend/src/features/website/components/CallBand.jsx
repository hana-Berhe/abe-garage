import { Link } from "react-router-dom";
import { useGarage } from "../useGarage";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";

// The red box near the bottom of a public page: phone number and a Contact us button.
export default function CallBand({ title, text }) {
  const g = useGarage();
  return (
    <section className="cta">
      <div className="wrap">
        <div className="cta-grid">
          <div><h2>{title}</h2><p>{text}</p></div>
          {g.phone && <a className="cta-phone" href={telHref(g.phone)}>{g.phone}</a>}
          <Link to="/contact" className="btn ghost">Contact us <Icon name="arrow" size={16} stroke={2.5} /></Link>
        </div>
      </div>
    </section>
  );
}
