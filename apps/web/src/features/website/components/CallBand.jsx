import { Link } from "react-router-dom";
import { useGarage } from "../useGarage";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";

// The red band near the bottom of each public page.
export default function CallBand({ title, text, link = { to: "/contact", label: "Find the garage" } }) {
  const g = useGarage();
  return (
    <section className="cta-band">
      <div className="site-wrap cta-band__inner">
        <div>
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div className="d-flex flex-wrap gap-2">
          {g.phone && <a href={telHref(g.phone)} className="btn btn-white btn-lg-site"><Icon name="phone" size={18} />Call {g.phone}</a>}
          <Link to={link.to} className="btn btn-outline-white btn-lg-site">{link.label}</Link>
        </div>
      </div>
    </section>
  );
}
