import { Link, NavLink, useLocation } from "react-router-dom";
import { useGarage } from "../features/website/useGarage";
import { useAuth } from "../features/auth/AuthContext";
import Icon from "../shared/components/Icon";
import { hour12, telHref } from "../shared/lib/format";

// The red swoosh car and the ABE GARAGE word mark from the classic design.
export function Brand({ light = false }) {
  return (
    <Link to="/" className={`logo${light ? " light" : ""}`} aria-label="Abe Garage home">
      <svg className="swoosh" viewBox="0 0 96 44" aria-hidden="true">
        <path d="M3 34c9-9 19-18 34-21 13-3 26-1 38 4 6 3 11 6 15 10" fill="none" stroke="var(--ag-red)" strokeWidth="5" strokeLinecap="round" />
        <path d="M12 30c8-6 18-11 30-12 11-1 21 2 29 6" fill="none" stroke="var(--ag-red)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M2 40c22-5 52-6 86-3" fill="none" stroke={light ? "#FFFFFF" : "var(--ag-navy)"} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M76 22l10 9-12 4" fill="none" stroke={light ? "#FFFFFF" : "var(--ag-navy)"} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="word"><b>ABE</b><span>GARAGE</span></span>
    </Link>
  );
}

// "Opens 8:00 AM · Closes 6:00 PM"
export const hoursText = (g) =>
  g.opening_time ? `Opens ${hour12(g.opening_time)}${g.closing_time ? ` · Closes ${hour12(g.closing_time)}` : ""}` : "";

const PAGES = [["/", "Home"], ["/about", "About us"], ["/services", "Services"], ["/contact", "Contact us"]];

// Red and navy top bar, then the white header. Used on every page, including the staff area.
// There is no online booking: the main action for customers is phoning the garage.
export default function Header() {
  const g = useGarage();
  const { employee, logout } = useAuth();
  const { pathname } = useLocation();
  const pages = employee ? [...PAGES, ["/admin", "Admin"]] : PAGES;
  const account = employee
    ? <button type="button" className="btn navy" onClick={logout}>Log out</button>
    : <Link to="/login" className="btn primary">Sign in</Link>;

  return (
    <>
      <div className="top">
        <span className="top-red">Enjoy the beso while we fix your car</span>
        <span className="top-mid">{hoursText(g) || "Mechanical repair and servicing"}{g.opening_time ? " · Cash payments only" : ""}</span>
        <span className="top-right">
          {employee
            ? <>Welcome <b>{employee.name.split(" ")[0]}</b></>
            : g.phone && <>Call Abe: <a href={telHref(g.phone)}><b>{g.phone}</b></a></>}
        </span>
      </div>
      <header className="hdr">
        <nav aria-label="Main">
          <Brand />
          <div className="links">
            {pages.map(([to, label]) => <NavLink key={to} to={to} end={to !== "/admin"}>{label}</NavLink>)}
          </div>
          <div className="hright">
            <span className="divider" aria-hidden="true" />
            {account}
            {/* The key closes the menu after each page change. */}
            <details className="menu" key={pathname}>
              <summary aria-label="Open menu"><Icon name="menu" size={22} /></summary>
              <div className="panel">
                {pages.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
                {g.phone && <a href={telHref(g.phone)} className="call">Call {g.phone}</a>}
                {employee
                  ? <button type="button" onClick={logout}>Log out</button>
                  : <Link to="/login">Sign in</Link>}
              </div>
            </details>
          </div>
        </nav>
      </header>
    </>
  );
}
