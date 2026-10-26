import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useGarage, usePublicServices } from "../features/website/useGarage";
import { hour12, telHref } from "../shared/lib/format";

export default function Footer() {
  const { employee } = useAuth();
  const g = useGarage();
  const { services } = usePublicServices();
  return (
    <footer className="site-footer no-print">
      <div className="hazard" />
      <div className="site-wrap site-footer__grid">
        <div>
          <span className="d site-footer__name">Abe <span className="text-yellow">Garage</span></span>
          <p className="m-0">Independent car repair. Price first, always.</p>
        </div>
        <div>
          <h2>Pages</h2>
          <Link to="/">Home</Link>
          <Link to="/services">Services and prices</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h2>Services</h2>
          {(services || []).slice(0, 4).map((s) => <Link key={s.service_id} to="/services">{s.name}</Link>)}
        </div>
        <div>
          <h2>Visit</h2>
          {g.address && <span>{g.address}</span>}
          {g.phone && <a href={telHref(g.phone)}>{g.phone}</a>}
          {g.email && <a href={`mailto:${g.email}`}>{g.email}</a>}
          {g.opening_time && <span>{hour12(g.opening_time)}{g.closing_time ? ` to ${hour12(g.closing_time)}` : " opening"}</span>}
        </div>
      </div>
      <div className="site-wrap site-footer__bottom">
        <span>© {new Date().getFullYear()} Abe Garage</span>
        {employee ? <Link to="/admin">Staff area</Link> : <Link to="/login">Staff login</Link>}
      </div>
    </footer>
  );
}
