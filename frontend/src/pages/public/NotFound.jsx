import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="container py-5 page-narrow">
      <h1 className="page-title">Page not found</h1>
      <p>The address you opened does not exist.</p>
      <Link to="/" className="btn btn-brand">Go home</Link>
    </section>
  );
}
