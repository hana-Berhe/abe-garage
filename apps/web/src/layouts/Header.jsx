import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useGarage } from "../features/website/useGarage";
import Icon from "../shared/components/Icon";
import { openingHours, telHref } from "../shared/lib/format";

export function Brand({ light = false, tagline = true }) {
  return (
    <Link to="/" className={`site-brand${light ? " site-brand--light" : ""}`}>
      <span className="site-brand__mark"><Icon name="wrench" size={22} /></span>
      <span className="site-brand__text">
        <span className="site-brand__name">Abe Garage</span>
        {tagline && <span className="site-brand__tag">Car repair &amp; service</span>}
      </span>
    </Link>
  );
}

export default function Header() {
  const { employee, logout } = useAuth();
  const g = useGarage();
  return (
    <>
      <div className="site-topbar">
        <div className="site-wrap site-topbar__inner">
          <div className="d-flex flex-wrap gap-3">
            {g.address && <span><Icon name="pin" size={16} /> {g.address}</span>}
            {g.opening_time && <span><Icon name="clock" size={16} /> {openingHours(g)}</span>}
          </div>
          {g.email && <a href={`mailto:${g.email}`}>{g.email}</a>}
        </div>
      </div>
      <header className="site-header">
        <div className="site-wrap site-header__inner">
          <Brand />
          <nav aria-label="Main" className="site-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="d-flex align-items-center gap-3">
            {g.phone && (
              <a href={telHref(g.phone)} className="site-call d-none d-lg-flex">
                <span className="site-call__icon"><Icon name="phone" size={18} /></span>
                <span><small>Call the desk</small><strong>{g.phone}</strong></span>
              </a>
            )}
            {employee ? (
              <>
                <Link to="/admin" className="btn btn-outline-secondary">Staff area</Link>
                <button type="button" className="btn btn-link px-1" onClick={logout}>Log out</button>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline-secondary">Staff login</Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
