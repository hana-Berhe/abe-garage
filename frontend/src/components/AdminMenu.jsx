import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../services/roles";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

// FR-DSH-01: only the links the role may use. Each module adds its own line.
const LINKS = [
  { to: "/admin", label: "Dashboard", roles: [M, A], end: true },
  { to: "/admin/my-jobs", label: "My jobs", roles: [T] },
  { to: "/admin/orders", label: "Orders", roles: [T, M, A] },
  { to: "/admin/order/new", label: "New order", roles: [M, A] },
  { to: "/admin/customers", label: "Customers", roles: [M, A] },
  { to: "/admin/services", label: "Services", roles: [A] },
  { to: "/admin/employees", label: "Employees", roles: [A] },
  { to: "/admin/settings", label: "Settings", roles: [A] },
  { to: "/admin/profile", label: "My account", roles: [T, M, A] },
];

export default function AdminMenu() {
  const { employee } = useAuth();
  return (
    <aside className="admin-menu no-print">
      <h2>Admin menu</h2>
      <nav>
        {LINKS.filter((l) => l.roles.includes(employee.role)).map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end}>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
