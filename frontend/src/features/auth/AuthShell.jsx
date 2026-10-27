import Icon from "../../shared/components/Icon";
import { Brand } from "../../layouts/Header";
import gearArt from "../../assets/gear.svg";

// The dark staff panel on the left of the login, forgot-password and reset-password pages.
export default function AuthShell({ children }) {
  return (
    <div className="ag login">
      <section className="hero">
        <Brand />
        <div style={{ position: "relative", zIndex: 2 }}>
          <div className="eyebrow">Staff only</div>
          <h1>Garage desk<br /><em>and workshop.</em></h1>
          <p>Orders, job cards and invoices, in one place. For Admin, Manager and Technician accounts.</p>
        </div>
        <div className="facts">
          <span><Icon name="cash" size={18} />Cash only</span>
          <span><Icon name="clock" size={18} />Opens 8:00 AM</span>
        </div>
        <img className="gear" src={gearArt} alt="" />
      </section>
      <main className="side">{children}</main>
    </div>
  );
}
