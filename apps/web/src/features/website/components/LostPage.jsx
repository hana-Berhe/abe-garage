import { Link } from "react-router-dom";
import { Brand } from "../../../layouts/Header";
import { useGarage } from "../useGarage";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";
import heroArt from "../../../assets/hero-lift.svg";

// Full dark page used for "page not found" and "no access".
export default function LostPage({ code, title, text, action = { to: "/", label: "Back to the home page" } }) {
  const g = useGarage();
  return (
    <div className="lost">
      <div className="site-wrap py-4"><Brand light tagline={false} /></div>
      <div className="site-wrap lost__body pb-5">
        <div>
          {code && <div className="lost__code">{code}</div>}
          <h1>{title}</h1>
          <p>{text}</p>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link to={action.to} className="btn btn-brand btn-lg-site">{action.label}</Link>
            {g.phone && <a href={telHref(g.phone)} className="btn btn-ghost-light btn-lg-site"><Icon name="phone" size={18} />Call {g.phone}</a>}
          </div>
        </div>
        <div className="site-hero__art"><img src={heroArt} alt="" /></div>
      </div>
    </div>
  );
}
