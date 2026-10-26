import { Link } from "react-router-dom";

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container py-5">
          <p className="eyebrow">Working since 1999</p>
          <h1>Tuneup your car to the next level</h1>
          <p className="lead">Know the price before any work starts, follow your car from a private link, and get a clear bill.</p>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/services" className="btn btn-brand btn-lg">See services and prices</Link>
            <Link to="/contact" className="btn btn-outline-light btn-lg">Contact us</Link>
          </div>
        </div>
      </section>
      <section className="container py-5">
        <div className="row g-4">
          {[
            ["Price first", "You get an estimate with 15% VAT shown before we touch your car."],
            ["Follow your car", "We email you a private link to see each job as it moves."],
            ["Clear bill", "Subtotal, VAT and total on one page. Pay in cash when it's ready."],
          ].map(([title, text]) => (
            <div className="col-md-4" key={title}>
              <div className="feature">
                <h3>{title}</h3>
                <p className="mb-0">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
