import { useGarage, usePublicServices } from "../useGarage";
import PageHero from "../components/PageHero";
import CallBand from "../components/CallBand";
import { hour12 } from "../../../shared/lib/format";
import frontArt from "../../../assets/front-y.svg";

export default function About() {
  const g = useGarage();
  const { services } = usePublicServices();
  const opens = g.opening_time ? hour12(g.opening_time).replace(":00", "") : "–";
  return (
    <>
      <PageHero crumb="About" title={<>A real local <span className="text-yellow">garage</span></>}
        side={<div className="art-frame"><img src={frontArt} alt="The front of Abe Garage" /></div>}>
        <p>{g.name || "Abe Garage"} is an independent workshop. We fix cars the way we would want ours fixed: price first, your yes, then the work.</p>
      </PageHero>

      <section className="sec sec--paper">
        <div className="site-wrap">
          <div className="split align-items-start">
            <div className="stack">
              <span className="tag">Our story</span>
              <h2 className="d h-section">Built on one simple rule</h2>
            </div>
            <div className="fs-5">
              <p>We service, check and repair all makes of car, from a quick oil change to finding the cause of a warning light.</p>
              <p className="story-quote m-0">One rule has never changed: no job starts until the customer knows the price and says yes.</p>
            </div>
          </div>
          <div className="stat-tiles">
            <div className="stat-tile stat-tile--dark"><span className="d">Cash</span><span>One payment when you collect the car</span></div>
            <div className="stat-tile"><span className="d">{services ? services.length : "–"}</span><span>Services we offer</span></div>
            <div className="stat-tile"><span className="d">1</span><span>Named technician for each job</span></div>
            <div className="stat-tile stat-tile--yellow"><span className="d">{opens}</span><span>When the doors open</span></div>
          </div>
        </div>
      </section>

      <CallBand title="Ask us what your car needs" link={{ to: "/services", label: "Our services" }} />
    </>
  );
}
