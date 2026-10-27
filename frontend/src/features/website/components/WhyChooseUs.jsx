import Icon from "../../../shared/components/Icon";

const REASONS = [
  ["user", "Skilled, named mechanics"],
  ["wrench", "Fast and careful work"],
  ["shield", "A clear price before any work"],
  ["mobile", "Follow your car live on your phone"],
];

// "Why choose us" next to the full list of services, as on the Home and Services pages.
export default function WhyChooseUs({ services }) {
  return (
    <section className="section white">
      <div className="wrap why">
        <div>
          <h2 className="h2">Why choose us</h2>
          <p className="lead">A local workshop that explains the problem in plain words and never starts work you have not agreed to.</p>
          <ul className="reasons">
            {REASONS.map(([icon, text]) => <li key={text}><Icon name={icon} size={30} stroke={1.5} />{text}</li>)}
          </ul>
        </div>
        <div>
          <h2 className="h2">All our services</h2>
          <ul className="ticks">
            {(services || []).map((s) => <li key={s.service_id}><Icon name="check" size={16} stroke={3} />{s.name}</li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}
