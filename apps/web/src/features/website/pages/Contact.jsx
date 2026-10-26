import { useEffect, useState } from "react";
import websiteApi from "../website.api";

const hour = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export default function Contact() {
  const [garage, setGarage] = useState(null);
  useEffect(() => { websiteApi.garage().then(setGarage).catch(() => setGarage({})); }, []);
  const g = garage || {};
  return (
    <section className="container py-5 page-narrow">
      <h1 className="page-title">Contact us</h1>
      <div className="ag-card">
        <dl className="kv">
          <div><dt>Address</dt><dd>{g.address || "–"}</dd></div>
          <div><dt>Phone</dt><dd>{g.phone ? <a href={`tel:${g.phone}`}>{g.phone}</a> : "–"}</dd></div>
          <div><dt>Email</dt><dd>{g.email ? <a href={`mailto:${g.email}`}>{g.email}</a> : "–"}</dd></div>
          <div><dt>Open</dt><dd>{g.opening_time ? `From ${hour(g.opening_time)}${g.closing_time ? ` to ${hour(g.closing_time)}` : ""}` : "–"}</dd></div>
        </dl>
      </div>
    </section>
  );
}
