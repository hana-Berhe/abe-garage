import { Link } from "react-router-dom";
import gearArt from "../../../assets/gear.svg";

// The dark band at the top of Services, About and Contact.
export default function PageHero({ crumb, eyebrow, title, children }) {
  return (
    <section className="ph">
      <div className="wrap">
        <nav aria-label="Breadcrumb" className="crumb"><Link to="/">Home</Link><span>/</span><span style={{ color: "#FFF" }}>{crumb}</span></nav>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {children}
      </div>
      <div className="bg" aria-hidden="true"><img src={gearArt} alt="" /></div>
    </section>
  );
}
