import { NavLink, Outlet } from "react-router-dom";
import AdminMenu from "./AdminMenu";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../features/auth/AuthContext";
import { ROLES } from "../shared/constants/roles";

// Staff pages: the site header and footer, with the admin menu on the left (design: admin.png).
export default function AdminLayout() {
  const { employee } = useAuth();
  const isTech = employee.role === ROLES.TECHNICIAN;
  return (
    <div className={`admin-page${isTech ? " is-tech" : ""}`}>
      <div className="ag chrome no-print"><Header /></div>
      <div className="admin-shell">
        <AdminMenu />
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
      <div className="ag chrome no-print"><Footer /></div>
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
