import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <section className="container py-5 page-narrow">
      <h1 className="page-title">Not allowed</h1>
      <p>Your account can't open this page.</p>
      <Link to="/admin" className="btn btn-brand">Back to the admin area</Link>
    </section>
  );
}
