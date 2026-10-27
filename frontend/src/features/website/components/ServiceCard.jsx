import { Link } from "react-router-dom";
import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";

// "About 1.5 hours" or "About 30 minutes"
export const duration = (hours) => {
  const h = Number(hours);
  if (!h) return null;
  return h < 1 ? `About ${Math.round(h * 60)} minutes` : `About ${h} ${h === 1 ? "hour" : "hours"}`;
};

// Home page card. No prices: those are for signed-in staff only.
export default function ServiceCard({ service, index }) {
  return (
    <article className="service">
      <small className="kicker">Service and repairs</small>
      <h3>{service.name}</h3>
      {service.description && <p>{service.description}</p>}
      <div className="service-foot">
        <Link className="more" to={`/services#service-${service.service_id}`}>Read more +</Link>
        <span className="sicon"><Icon name={SERVICE_ICONS[index % SERVICE_ICONS.length]} size={44} stroke={1.2} /></span>
      </div>
    </article>
  );
}
