import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ROLES, ROLE_NAMES } from "../shared/constants/roles";
import Icon from "../shared/components/Icon";
import { initials } from "../shared/lib/format";
import callbackApi, { CALLBACKS_CHANGED } from "../features/callbacks/callback.api";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

// FR-DSH-01: only the links the role may use. Each module adds its own line.
export const LINKS = [
  { to: "/admin", label: "Dashboard", icon: "grid", roles: [M, A], end: true },
  { to: "/admin/my-jobs", label: "My jobs", icon: "wrench", roles: [T] },
  { to: "/admin/orders", label: "Orders", icon: "clipboard", roles: [T, M, A] },
  { to: "/admin/order/new", label: "New order", icon: "plus", roles: [M, A] },
  { to: "/admin/customers", label: "Customers", icon: "users", roles: [M, A] },
  { to: "/admin/callbacks", label: "Call-backs", icon: "phone", roles: [M, A] },
  { to: "/admin/services", label: "Services", icon: "tag", roles: [A] },
  { to: "/admin/employees", label: "Employees", icon: "badge", roles: [A] },
  { to: "/admin/settings", label: "Settings", icon: "settings", roles: [A] },
  { to: "/admin/profile", label: "My account", icon: "user", roles: [T, M, A] },
];

export function allowedLinks(role) {
  return LINKS.filter((l) => l.roles.includes(role));
}

// How many website call-back requests nobody has called yet. Refreshed on each page change and after "Mark as called".
function useNewCallbacks(role) {
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);
  const allowed = [M, A].includes(role);
  useEffect(() => {
    if (!allowed) return undefined;
    let live = true;
    const load = () => callbackApi.list({ status: "new", limit: 1 }).then((d) => live && setCount(d.new_count)).catch(() => {});
    load();
    window.addEventListener(CALLBACKS_CHANGED, load);
    return () => { live = false; window.removeEventListener(CALLBACKS_CHANGED, load); };
  }, [allowed, pathname]);
  return count;
}

export default function AdminMenu() {
  const { employee, logout } = useAuth();
  const newCallbacks = useNewCallbacks(employee.role);
  const [first, last] = (employee.name || "").split(" ");
  return (
    <aside className="admin-menu no-print">
      <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true"><Icon name="gear" size={20} stroke={2.2} /></span><span>ABE<span className="o">GARAGE</span></span></Link>
      <nav aria-label="Admin menu">
        {allowedLinks(employee.role).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <span className="ico"><Icon name={l.icon} size={20} /></span>
            {l.label}
            {l.to === "/admin/callbacks" && newCallbacks > 0 && <span className="count" aria-label={`${newCallbacks} new`}>{newCallbacks}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="admin-user">
        <span className="admin-user__avatar" aria-hidden="true">{initials(first, last)}</span>
        <span><strong>{employee.name}</strong><small>{ROLE_NAMES[employee.role]}</small></span>
        <button type="button" onClick={logout} aria-label="Log out" title="Log out"><Icon name="logout" size={20} /></button>
      </div>
    </aside>
  );
}
