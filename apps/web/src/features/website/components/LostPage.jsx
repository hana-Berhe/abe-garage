import { Link } from "react-router-dom";
import { Brand } from "../../../layouts/Header";
import { useGarage } from "../useGarage";
import { telHref } from "../../../shared/lib/format";
import heroArt from "../../../assets/hero-y.svg";

// Full black page used for "page not found" and "no access".
export default function LostPage({ code, title, text, action = { to: "/", label: "Back to the home page" } }) {
  const g = useGarage();
  return (
    <div className="lost">
      <div className="site-wrap py-4"><Brand small tagline={false} /></div>
      <div className="site-wrap lost__body pb-5">
        <div>
          {code && <div className="lost__code">{code}</div>}
          <h1 className="d">{title}</h1>
          <p>{text}</p>
          <div className="d-flex flex-wrap gap-2 mt-4">
            <Link to={action.to} className="site-btn site-btn--yellow">{action.label}</Link>
            {g.phone && <a href={telHref(g.phone)} className="site-btn site-btn--ghost">Call {g.phone}</a>}
          </div>
        </div>
        <div><img src={heroArt} alt="" className="w-100" /></div>
      </div>
    </div>
  );
}
