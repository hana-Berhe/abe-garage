import { Link } from "react-router-dom";

// The dark band at the top of About, Services and Contact.
export default function PageHero({ crumb, title, children, art }) {
  return (
    <section className="site-hero">
      <div className="site-wrap site-hero__inner">
        <div className="site-hero__text">
          <nav aria-label="Breadcrumb" className="site-crumbs"><Link to="/">Home</Link> / <span>{crumb}</span></nav>
          <h1>{title}</h1>
          {children}
        </div>
        {art && <div className="site-hero__art">{art}</div>}
      </div>
    </section>
  );
}
