import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer no-print">
      <div className="container py-4 d-flex flex-wrap justify-content-between gap-3">
        <div>
          <div className="brand brand-light">Abe Garage</div>
          <p className="mb-0 small">Honest car repair, clear prices, no surprises.</p>
        </div>
        <div className="small">
          <div><Link to="/services">Services and prices</Link></div>
          <div><Link to="/contact">Contact us</Link></div>
        </div>
        <div className="small">© {new Date().getFullYear()} Abe Garage</div>
      </div>
    </footer>
  );
}
