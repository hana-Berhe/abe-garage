import { Link } from "react-router-dom";
import { useGarage } from "../useGarage";
import Icon from "../../../shared/components/Icon";
import CallUs from "./CallUs";

// The orange band near the bottom of a public page.
export default function CallBand({ title, text }) {
  const g = useGarage();
  return (
    <section className="cta">
      <div className="wrap cta-grid">
        <div><h2>{title}</h2><p>{text}</p></div>
        <div className="btns">
          <CallUs className="btn dark" label={g.phone ? `Call ${g.phone}` : "Call us"} />
          <Link to="/contact" className="btn line">Find us <Icon name="pin" size={16} /></Link>
        </div>
      </div>
    </section>
  );
}
