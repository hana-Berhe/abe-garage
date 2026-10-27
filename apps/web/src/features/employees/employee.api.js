import { fetchApi } from "../../shared/api/client";

const employeeService = {
  login: (email, password) => fetchApi("/api/auth/login", { method: "POST", body: { email, password } }),
  changePassword: (old_password, new_password) =>
    fetchApi("/api/auth/password", { method: "PATCH", body: { old_password, new_password } }),
  list: ({ page, search, role, active } = {}) => fetchApi("/api/employees", { query: { page, search, role, active } }),
  // Active technicians for the assign list (managers only ever get these).
  technicians: () => fetchApi("/api/employees", { query: { role: 1, active: 1, page_size: 100 } }),
  get: (id) => fetchApi(`/api/employees/${id}`),
  create: (employee) => fetchApi("/api/employees", { method: "POST", body: employee }),
  update: (id, employee) => fetchApi(`/api/employees/${id}`, { method: "PATCH", body: employee }),
};

export default employeeService;
