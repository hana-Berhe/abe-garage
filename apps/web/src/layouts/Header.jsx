import { Link, NavLink } from "react-router-dom";
import { useGarage } from "../features/website/useGarage";
import { reviewsToShow } from "../features/website/reviews";
import Icon from "../shared/components/Icon";
import { openingHours, telHref } from "../shared/lib/format";

export function Brand({ tagline = true, small = false }) {
  return (
    <Link to="/" className={`site-brand${small ? " site-brand--small" : ""}`}>
      <span className="site-brand__mark"><Icon name="wrench" size={small ? 22 : 26} /></span>
      <span className="site-brand__text">
        <span className="site-brand__name">Abe Garage</span>
        {tagline && <span className="site-brand__tag">Independent car repair</span>}
      </span>
    </Link>
  );
}

// There is no online booking, so the main action is a phone call.
export default function Header() {
  const g = useGarage();
  return (
    <>
      <div className="site-topbar">
        <div className="site-wrap site-topbar__inner">
          {g.opening_time ? <span><Icon name="clock" size={16} /> {openingHours(g)}</span> : <span />}
          {g.address && <span><Icon name="pin" size={16} /> {g.address} · Cash payment only</span>}
        </div>
      </div>
      <header className="site-header">
        <div className="site-wrap site-header__inner">
          <Brand />
          <nav aria-label="Main" className="site-nav">
            <NavLink to="/" end>Home</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/about">About</NavLink>
            {reviewsToShow().reviews.length > 0 && <Link to="/#reviews">Reviews</Link>}
            <NavLink to="/contact">Contact</NavLink>
          </nav>
          <div className="d-flex align-items-center gap-3">
            {g.phone && (
              <a href={telHref(g.phone)} className="site-call hide-sm">
                <small>Call the desk</small><strong>{g.phone}</strong>
              </a>
            )}
            {g.phone
              ? <a href={telHref(g.phone)} className="site-btn site-btn--yellow site-btn--sm">Get a price</a>
              : <Link to="/contact" className="site-btn site-btn--yellow site-btn--sm">Get a price</Link>}
          </div>
        </div>
      </header>
    </>
  );
}
