import { Link } from "react-router-dom";
import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";

// "about 1.5 h" or "about 30 min"
export const duration = (hours) => {
  const h = Number(hours);
  if (!h) return null;
  return h < 1 ? `about ${Math.round(h * 60)} min` : `about ${h} h`;
};

// Home page tile. The first tile is yellow. No prices: those are for signed-in staff only.
export default function ServiceCard({ service, index }) {
  const first = index === 0;
  return (
    <Link to="/services" className={`tile${first ? " tile--yellow" : ""}`}>
      <div className="tile__top">
        <span className="sq"><Icon name={SERVICE_ICONS[index % SERVICE_ICONS.length]} size={26} /></span>
        {first && <span className="mono">Most booked</span>}
      </div>
      <h3 className="d">{service.name}</h3>
      <p>{service.description || ""}</p>
      <div className="tile__price">
        <span className="mono small fw-bold text-uppercase">{duration(service.labor_hours) || "Ask the desk"}</span>
        <Icon name="arrow" size={24} stroke={2.5} />
      </div>
    </Link>
  );
}
