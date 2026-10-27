import { Link } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useGarage, usePublicServices } from "../features/website/useGarage";
import Icon from "../shared/components/Icon";
import { telHref } from "../shared/lib/format";
import { Brand, hoursText } from "./Header";

// Navy footer: the address, email and phone strip, then the link columns.
export default function Footer() {
  const { employee } = useAuth();
  const g = useGarage();
  const { services } = usePublicServices();
  return (
    <footer className="foot">
      <div className="foot-strip">
        <div className="wrap strip-grid">
          <div><Icon name="pin" size={30} stroke={1.5} /><span>{g.address || "Visit the garage"}<br /><small>Walk-ins welcome</small></span></div>
          <div><Icon name="mail" size={30} stroke={1.5} /><span>Email us :<br />{g.email ? <a href={`mailto:${g.email}`}>{g.email}</a> : "Ask at the desk"}</span></div>
          <div><Icon name="phone" size={30} stroke={1.5} /><span>Call us on :<br />{g.phone ? <a href={telHref(g.phone)}><b className="big">{g.phone}</b></a> : "See the Contact page"}</span></div>
        </div>
      </div>
      <div className="wrap foot-grid">
        <div className="foot-about">
          <Brand light />
          <p>Mechanical repair and servicing for everyday cars. Clear answers, and we always ask before any extra work.</p>
        </div>
        <div>
          <h4>Useful links</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About us</Link></li>
            <li><Link to="/services">Services</Link></li>
            <li><Link to="/contact">Contact us</Link></li>
            <li>{employee ? <Link to="/admin">Staff area</Link> : <Link to="/login">Staff sign in</Link>}</li>
          </ul>
        </div>
        <div>
          <h4>Our services</h4>
          <ul>{(services || []).slice(0, 5).map((s) => <li key={s.service_id}><Link to={`/services#service-${s.service_id}`}>{s.name}</Link></li>)}</ul>
        </div>
        <div>
          <h4>Opening hours</h4>
          <ul>
            {g.opening_time && <li>{hoursText(g)}</li>}
            <li>Cash payments only, at pick-up</li>
            <li>We give you a price after we check your car</li>
          </ul>
        </div>
      </div>
      <div className="wrap bar">
        <span>© {new Date().getFullYear()} {g.name || "Abe Garage"}. Mechanical repair and maintenance.</span>
      </div>
    </footer>
  );
}
