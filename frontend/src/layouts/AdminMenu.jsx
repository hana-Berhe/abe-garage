import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { ROLES, ROLE_NAMES } from "../shared/constants/roles";
import Icon from "../shared/components/Icon";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

// FR-DSH-01: only the links the role may use. Each module adds its own line.
export const LINKS = [
  { to: "/admin", label: "Dashboard", roles: [M, A], end: true },
  { to: "/admin/my-jobs", label: "My jobs", roles: [T] },
  { to: "/admin/orders", label: "Orders", roles: [T, M, A] },
  { to: "/admin/order/new", label: "New order", roles: [M, A] },
  { to: "/admin/employee/new", label: "Add employee", roles: [A] },
  { to: "/admin/employees", label: "Employees", roles: [A] },
  { to: "/admin/customer/new", label: "Add customer", roles: [M, A] },
  { to: "/admin/customers", label: "Customers", roles: [M, A] },
  { to: "/admin/services", label: "Services", roles: [A] },
  { to: "/admin/settings", label: "Settings", roles: [A] },
  { to: "/admin/profile", label: "My account", roles: [T, M, A] },
];

export function allowedLinks(role) {
  return LINKS.filter((l) => l.roles.includes(role));
}

export default function AdminMenu() {
  const { employee } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const title = employee.role === ROLES.TECHNICIAN ? "Workshop menu" : "Admin menu";
  return (
    <aside className={`admin-menu no-print${open ? " open" : ""}`}>
      <h2>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="admin-links">
          {title}<Icon name="menu" size={20} />
        </button>
        <span>{title}</span>
      </h2>
      <nav id="admin-links" aria-label={title}>
        {allowedLinks(employee.role).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>{l.label}</NavLink>
        ))}
      </nav>
      <p className="admin-who">Signed in as <b>{employee.name}</b><br />{ROLE_NAMES[employee.role]}</p>
    </aside>
  );
}
