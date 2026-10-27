import CallUs from "./CallUs";

// The dark "What happens next" card on the Home and Contact pages.
export default function HowItWorks({ opens }) {
  return (
    <div className="next">
      <div className="eyebrow">What happens next</div>
      <div className="steps">
        <div className="step on"><h3>You call us</h3><p>Tell us what the car is doing. We answer from {opens}.</p></div>
        <div className="step"><h3>We agree a price and a time</h3><p>Nothing is booked until we have spoken.</p></div>
        <div className="step"><h3>You bring the car in</h3><p>Or just drive in during opening hours.</p></div>
      </div>
      <div style={{ marginTop: 26 }}><CallUs /></div>
    </div>
  );
}
