import { Link } from "react-router-dom";
import { useGarage } from "../useGarage";
import { telHref } from "../../../shared/lib/format";

// The yellow band near the bottom of a public page.
export default function CallBand({ title, link = { to: "/contact", label: "Find the garage" } }) {
  const g = useGarage();
  return (
    <section className="cta-band">
      <div className="site-wrap cta-band__inner">
        <h2 className="d">{title}</h2>
        <div className="d-flex flex-wrap gap-2">
          {g.phone && <a href={telHref(g.phone)} className="site-btn site-btn--ink">Call for a price</a>}
          <Link to={link.to} className="site-btn site-btn--outline">{link.label}</Link>
        </div>
      </div>
    </section>
  );
}
