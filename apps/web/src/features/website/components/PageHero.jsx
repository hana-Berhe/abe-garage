import { Link } from "react-router-dom";

// The black band at the top of About, Services and Contact, ending in a hazard stripe.
export default function PageHero({ crumb, title, children, side }) {
  return (
    <section className="site-hero site-hero--page">
      <div className="site-wrap site-hero__inner">
        <div className="site-hero__text">
          <nav aria-label="Breadcrumb" className="site-crumbs"><Link to="/">Home</Link> / {crumb}</nav>
          <h1 className="d">{title}</h1>
          {children}
        </div>
        {side && <div className="site-hero__art">{side}</div>}
      </div>
      <div className="hazard" />
    </section>
  );
}
