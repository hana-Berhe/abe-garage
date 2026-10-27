import { Link } from "react-router-dom";
import { useGarage } from "../useGarage";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";

// The orange band near the bottom of a public page.
export default function CallBand({ title, text }) {
  const g = useGarage();
  return (
    <section className="cta">
      <div className="wrap cta-grid">
        <div><h2>{title}</h2><p>{text}</p></div>
        <div className="btns">
          <Link to="/contact#callback" className="btn dark">Request a call back <Icon name="up" size={16} stroke={2.5} /></Link>
          {g.phone && <a href={telHref(g.phone)} className="btn line"><Icon name="phone" size={16} /> {g.phone}</a>}
        </div>
      </div>
    </section>
  );
}
