import { Link } from "react-router-dom";
import { useGarage } from "../useGarage";
import Icon from "../../../shared/components/Icon";
import { telHref } from "../../../shared/lib/format";

// There is no online booking and no call-back form: the main action is phoning the garage.
// Until the garage phone is set in Settings, it falls back to the Contact page.
export default function CallUs({ className = "btn primary", label = "Call us" }) {
  const g = useGarage();
  if (!g.phone) return <Link to="/contact" className={className}>Contact us <Icon name="arrow" size={16} stroke={2.5} /></Link>;
  return <a href={telHref(g.phone)} className={className}><Icon name="phone" size={16} /> {label}</a>;
}
