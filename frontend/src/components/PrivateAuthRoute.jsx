import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// FR-AUTH-05: logged out goes to Login, wrong role goes to Unauthorized.
export default function PrivateAuthRoute({ roles, children }) {
  const { employee } = useAuth();
  const location = useLocation();
  if (!employee) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (roles && !roles.includes(employee.role)) return <Navigate to="/unauthorized" replace />;
  return children;
}
