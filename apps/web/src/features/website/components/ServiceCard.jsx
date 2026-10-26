import Icon, { SERVICE_ICONS } from "../../../shared/components/Icon";
import { money } from "../../../shared/lib/format";

// "about 1.5 h" or "about 30 min"
export const duration = (hours) => {
  const h = Number(hours);
  if (!h) return null;
  return h < 1 ? `about ${Math.round(h * 60)} min` : `about ${h} h`;
};

export default function ServiceCard({ service, index, large = false }) {
  return (
    <article className="site-card">
      <span className={`icon-tile${large ? "" : " icon-tile--sm"}`}><Icon name={SERVICE_ICONS[index % SERVICE_ICONS.length]} size={large ? 26 : 22} /></span>
      <h3>{service.name}</h3>
      {service.description && <p>{service.description}</p>}
      <div className="site-card__price">
        <span>
          <span className={large ? "price-xl" : "price-big"}>{money(service.price)}</span>
          {large && <span className="text-muted small ms-2">before VAT</span>}
        </span>
        {duration(service.labor_hours) && <span className="text-muted small">{duration(service.labor_hours)}</span>}
      </div>
    </article>
  );
}
