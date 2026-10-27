import { Link } from "react-router-dom";
import gearArt from "../../../assets/gear.svg";

// The dark band at the top of Services, About and Contact: page name and breadcrumb.
export default function PageHero({ crumb, title, children }) {
  return (
    <section className="ph">
      <div className="wrap">
        <h1>{title}</h1>
        <nav aria-label="Breadcrumb" className="crumb"><Link to="/">Home</Link><span aria-hidden="true">›</span><span>{crumb}</span></nav>
        {children}
      </div>
      <div className="bg" aria-hidden="true"><img src={gearArt} alt="" /></div>
    </section>
  );
}
