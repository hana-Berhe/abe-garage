import { Link, NavLink, useLocation } from "react-router-dom";
import { useGarage } from "../features/website/useGarage";
import { reviewsToShow } from "../features/website/reviews";
import Icon from "../shared/components/Icon";
import { hour12, telHref } from "../shared/lib/format";

export function Brand() {
  return (
    <Link to="/" className="logo" aria-label="Abe Garage home">
      <span className="mark"><Icon name="gear" size={22} stroke={2.2} /></span>
      <span>ABE<span className="o">GARAGE</span></span>
    </Link>
  );
}

// "Opens 8:00 AM · Closes 6:00 PM"
export const hoursText = (g) =>
  g.opening_time ? `Opens ${hour12(g.opening_time)}${g.closing_time ? ` · Closes ${hour12(g.closing_time)}` : ""}` : "";

// There is no online booking. The main action is "Request a call back", which goes to the form on the Contact page.
export default function Header() {
  const g = useGarage();
  const { pathname } = useLocation();
  const pages = [["/", "Home"], ["/services", "Services"], ["/about", "About"], ["/contact", "Contact"]];
  return (
    <>
      <div className="top">
        <div className="wrap">
          <span><Icon name="clock" size={15} /> {hoursText(g)}{g.opening_time ? " · " : ""}Cash payments only</span>
          {(g.address || g.phone) && <span><Icon name="pin" size={15} /> {[g.address, g.phone].filter(Boolean).join(" · ")}</span>}
        </div>
      </div>
      <header className="hdr">
        <nav className="wrap" aria-label="Main">
          <Brand />
          <div className="links">
            {pages.map(([to, label]) => <NavLink key={to} to={to} end>{label}</NavLink>)}
            {reviewsToShow().reviews.length > 0 && <Link to="/#reviews">Reviews</Link>}
          </div>
          <div className="hright">
            <Link to="/contact#callback" className="btn primary call-lg">Request a call back <Icon name="up" size={16} stroke={2.5} /></Link>
            {g.phone && (
              <a href={telHref(g.phone)} className="btn primary menu-call" style={{ padding: "12px 14px", minHeight: 44 }} aria-label="Call the garage">
                <Icon name="phone" size={18} />
              </a>
            )}
            {/* The key closes the menu after each page change. */}
            <details className="menu" key={pathname}>
              <summary aria-label="Open menu"><Icon name="menu" size={22} /></summary>
              <div className="panel">
                {pages.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
                <Link to="/contact#callback" style={{ color: "var(--orange)" }}>Request a call back</Link>
                {g.phone && <a href={telHref(g.phone)} style={{ color: "var(--orange)" }}>Call {g.phone}</a>}
              </div>
            </details>
          </div>
        </nav>
      </header>
    </>
  );
}
