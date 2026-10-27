import { NavLink, Outlet } from "react-router-dom";
import { format } from "date-fns";
import AdminMenu from "./AdminMenu";
import { useAuth } from "../features/auth/AuthContext";
import { ROLES, ROLE_NAMES } from "../shared/constants/roles";

export default function AdminLayout() {
  const { employee, logout } = useAuth();
  const isTech = employee.role === ROLES.TECHNICIAN;
  return (
    <div className={`admin-shell${isTech ? " is-tech" : ""}`}>
      <AdminMenu />
      <div className="d-flex flex-column min-w-0">
        <header className="admin-top no-print">
          <span>{format(new Date(), "EEEE, d MMMM yyyy")}</span>
          <span className="d-flex d-md-none align-items-center gap-3">
            <span><span className="who">{employee.name}</span> · {ROLE_NAMES[employee.role]}</span>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={logout}>Log out</button>
          </span>
        </header>
        <main className="admin-content flex-grow-1">
          <Outlet />
        </main>
      </div>
      {isTech && (
        <nav className="bottom-nav no-print" aria-label="Technician menu">
          <NavLink to="/admin/my-jobs">My jobs</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
          <NavLink to="/admin/profile">Account</NavLink>
        </nav>
      )}
    </div>
  );
}
