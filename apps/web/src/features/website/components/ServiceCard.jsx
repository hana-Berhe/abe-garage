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
      <div className="sicon"><Icon name={SERVICE_ICONS[index % SERVICE_ICONS.length]} size={26} /></div>
      <h3>{service.name}</h3>
      <p>{service.description || ""}</p>
      <Link className="more" to={`/services#service-${service.service_id}`}>See more <Icon name="arrow" size={15} stroke={2.5} /></Link>
    </article>
  );
}
