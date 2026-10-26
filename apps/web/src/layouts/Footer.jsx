import { Link } from "react-router-dom";
import { useGarage, usePublicServices } from "../features/website/useGarage";
import { Brand } from "./Header";
import { openingHours } from "../shared/lib/format";

export default function Footer() {
  const g = useGarage();
  const { services } = usePublicServices();
  return (
    <footer className="site-footer no-print">
      <div className="site-wrap site-footer__grid">
        <div>
          <Brand light tagline={false} />
          <p className="mt-3">Honest car repair with the price agreed before work starts.</p>
        </div>
        <div>
          <h2>Pages</h2>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
          <Link to="/services">Services and prices</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div>
          <h2>Services</h2>
          {(services || []).slice(0, 4).map((s) => <Link key={s.service_id} to="/services">{s.name}</Link>)}
        </div>
        <div>
          <h2>Visit</h2>
          {g.address && <span>{g.address}</span>}
          {g.phone && <span>{g.phone}</span>}
          {g.email && <span>{g.email}</span>}
          {g.opening_time && <span>{openingHours(g)}</span>}
        </div>
      </div>
      <div className="site-wrap site-footer__bottom">
        <span>© {new Date().getFullYear()} Abe Garage</span>
        <Link to="/login">Staff login</Link>
      </div>
    </footer>
  );
}
