import { Link } from "react-router-dom";
import Header from "../../../layouts/Header";
import Footer from "../../../layouts/Footer";
import Icon from "../../../shared/components/Icon";
import gearArt from "../../../assets/gear.svg";

// Dark page used for "page not found" and "no access".
export default function LostPage({ code, eyebrow, title, text, action = { to: "/", label: "Back to home" } }) {
  return (
    <div className="ag">
      <Header />
      <main>
        <section className="hero">
          <div className="wrap lost">
            <div>
              <div className="eyebrow">{eyebrow}</div>
              <h1>{title}</h1>
              <p>{text}</p>
              <div className="actions">
                <Link className="btn primary" to={action.to}>{action.label} <Icon name="arrow" size={16} stroke={2.5} /></Link>
                <Link className="btn outline" to="/contact">Contact us</Link>
              </div>
            </div>
            <div className="lost-art" aria-hidden="true">
              <b>{code || "!"}</b>
              <img src={gearArt} alt="" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
