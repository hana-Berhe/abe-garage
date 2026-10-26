import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ROLES } from "../shared/constants/roles";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

// FR-DSH-01: only the links the role may use. Each module adds its own line.
export const LINKS = [
  { to: "/admin", label: "Dashboard", icon: "▦", roles: [M, A], end: true },
  { to: "/admin/my-jobs", label: "My jobs", icon: "✓", roles: [T] },
  { to: "/admin/orders", label: "Orders", icon: "☰", roles: [T, M, A] },
  { to: "/admin/order/new", label: "New order", icon: "+", roles: [M, A] },
  { to: "/admin/customers", label: "Customers", icon: "☺", roles: [M, A] },
  { to: "/admin/services", label: "Services", icon: "⚙", roles: [A] },
  { to: "/admin/employees", label: "Employees", icon: "◉", roles: [A] },
  { to: "/admin/settings", label: "Settings", icon: "✎", roles: [A] },
  { to: "/admin/profile", label: "My account", icon: "◔", roles: [T, M, A] },
];

export function allowedLinks(role) {
  return LINKS.filter((l) => l.roles.includes(role));
}

export default function AdminMenu() {
  const { employee } = useAuth();
  return (
    <aside className="admin-menu no-print">
      <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">A</span>Abe Garage</Link>
      <nav aria-label="Admin menu">
        {allowedLinks(employee.role).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            <span className="ico" aria-hidden="true">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
