import { Link } from "react-router-dom";
import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";

// "about 1.5 h" or "about 30 min"
export const duration = (hours) => {
  const h = Number(hours);
  if (!h) return null;
  return h < 1 ? `about ${Math.round(h * 60)} min` : `about ${h} h`;
};

// Whole dollars when the price has no cents ($50), otherwise two decimals ($49.50).
export const shortMoney = (v) => {
  const n = Number(v || 0);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
};

// Home page tile. The first tile is yellow.
export default function ServiceCard({ service, index }) {
  const first = index === 0;
  return (
    <Link to="/services" className={`tile${first ? " tile--yellow" : ""}`}>
      <div className="tile__top">
        <span className="sq"><Icon name={SERVICE_ICONS[index % SERVICE_ICONS.length]} size={26} /></span>
        <span className="mono">{first ? "Most booked" : duration(service.labor_hours)}</span>
      </div>
      <h3 className="d">{service.name}</h3>
      <p>{service.description || ""}</p>
      <div className="tile__price">
        <span><small>FROM</small><span className="d">{shortMoney(service.price)}</span></span>
        <Icon name="arrow" size={24} stroke={2.5} />
      </div>
    </Link>
  );
}
