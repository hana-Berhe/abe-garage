import { Navigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { ROLES } from "../../../services/roles";

// FR-DSH-02/03 counters come from GET /api/dashboard (Member 4). Technicians go to My jobs.
export default function Dashboard() {
  const { employee } = useAuth();
  if (employee.role === ROLES.TECHNICIAN) return <Navigate to="/admin/my-jobs" replace />;
  const counters = ["Awaiting approval", "In progress", "Completed today", "Unpaid"];
  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <div className="row g-3">
        {counters.map((c) => (
          <div className="col-6 col-lg-3" key={c}>
            <div className="counter">
              <div className="counter-value">–</div>
              <div className="counter-label">{c}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-muted mt-3 small">Counters fill in once the dashboard API is ready.</p>
    </>
  );
}
