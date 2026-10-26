import { useEffect, useState } from "react";
import serviceService from "../../services/service.api";
import Alert from "../../../shared/components/Alert";
import { money } from "../../../shared/lib/format";

// FR-WEB-02, FR-SRV-04: the live price list.
export default function Services() {
  const [services, setServices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    serviceService.listPublic().then(setServices).catch((e) => setError(e.message));
  }, []);

  return (
    <section className="container py-5">
      <h1 className="page-title">Our services</h1>
      <p className="muted">Prices are before 15% VAT. You always get a full estimate before we start.</p>
      <Alert>{error}</Alert>
      <div className="row g-3">
        {(services || []).map((s) => (
          <div className="col-md-6 col-lg-4" key={s.service_id}>
            <div className="feature">
              <h3>{s.name}</h3>
              {s.description && <p className="muted">{s.description}</p>}
              <div className="d-flex justify-content-between align-items-end">
                <span className="ag-display fs-2">{money(s.price)}</span>
                {Number(s.labor_hours) > 0 && <span className="muted small">about {Number(s.labor_hours)} h</span>}
              </div>
            </div>
          </div>
        ))}
        {services && services.length === 0 && <p className="muted">Our price list is coming soon.</p>}
      </div>
    </section>
  );
}
