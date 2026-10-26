import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useGarage, usePublicServices } from "../features/website/useGarage";
import { telHref } from "../shared/lib/format";
import { Brand, hoursText } from "./Header";

export default function Footer() {
  const { employee } = useAuth();
  const g = useGarage();
  const { services } = usePublicServices();
  return (
    <footer className="foot">
      <div className="wrap foot-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Brand />
          <p style={{ margin: 0, lineHeight: 1.75, maxWidth: 300 }}>Mechanical repair and servicing for everyday cars. Clear answers, and we always ask before any extra work.</p>
        </div>
        <div>
          <h4>Pages</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li>{employee ? <Link to="/admin">Staff area</Link> : <Link to="/login">Staff sign in</Link>}</li>
          </ul>
        </div>
        <div>
          <h4>Services</h4>
          <ul>{(services || []).slice(0, 6).map((s) => <li key={s.service_id}><Link to={`/services#service-${s.service_id}`}>{s.name}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Visit</h4>
          <ul>
            {g.address && <li>{g.address}</li>}
            {g.phone && <li><a href={telHref(g.phone)}>{g.phone}</a></li>}
            {g.email && <li><a href={`mailto:${g.email}`}>{g.email}</a></li>}
            {g.opening_time && <li>{hoursText(g)}</li>}
            <li>Cash payments only</li>
          </ul>
        </div>
      </div>
      <div className="wrap bar">
        <span>© {new Date().getFullYear()} ABE GARAGE. Mechanical repair and maintenance.</span>
        <span>We give you a price after we check your car.</span>
      </div>
    </footer>
  );
}
