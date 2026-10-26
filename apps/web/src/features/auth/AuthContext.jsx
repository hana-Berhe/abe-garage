import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setUnauthorizedHandler, tokenStore } from "../../shared/api/client";
import employeeService from "../employees/employee.api";

const AuthContext = createContext(null);

// Reads id, role and name from the JWT. The server still checks every request.
function readToken(token) {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp * 1000 < Date.now()) return null;
    return { id: payload.employee_id, role: payload.role_id, name: payload.name };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(() => readToken(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.clear();
    setEmployee(null);
    navigate("/");
  }, [navigate]);

  useEffect(() => {
    if (!employee) tokenStore.clear();
    setUnauthorizedHandler(() => {
      tokenStore.clear();
      setEmployee(null);
      navigate("/login", { state: { message: "Your session has ended, please log in again." } });
    });
  }, [employee, navigate]);

  const login = useCallback(async (email, password) => {
    const { token } = await employeeService.login(email, password);
    tokenStore.set(token);
    const who = readToken(token);
    setEmployee(who);
    return who;
  }, []);

  const value = useMemo(() => ({ employee, isLoggedIn: !!employee, login, logout }), [employee, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
