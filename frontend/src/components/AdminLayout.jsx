import { Outlet } from "react-router-dom";
import AdminMenu from "./AdminMenu";

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminMenu />
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}
