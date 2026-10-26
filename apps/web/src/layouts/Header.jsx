import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export default function Header() {
  const { employee, logout } = useAuth();
  return (
    <header className="site-header">
      <div className="topbar">
        <div className="container d-flex justify-content-between flex-wrap gap-2">
          <span>Enjoy the Abe Garage experience</span>
          <span>Schedule your appointment today: <strong>1800 456 7890</strong></span>
        </div>
      </div>
      <nav className="container d-flex align-items-center justify-content-between flex-wrap gap-2 py-3">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">A</span>Abe Garage
        </Link>
        <div className="main-nav d-flex align-items-center flex-wrap gap-3">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/about">About us</NavLink>
          <NavLink to="/services">Services</NavLink>
          <NavLink to="/contact">Contact us</NavLink>
          {employee ? (
            <>
              <NavLink to="/admin">Admin</NavLink>
              <span className="who d-none d-md-inline">Hi, {employee.name}</span>
              <button type="button" className="btn btn-brand" onClick={logout}>Log out</button>
            </>
          ) : (
            <Link to="/login" className="btn btn-brand">Sign in</Link>
          )}
        </div>
      </nav>
    </header>
  );
}
