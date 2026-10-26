import { fetchApi } from "./api";

const employeeService = {
  login: (email, password) => fetchApi("/api/employee/login", { method: "POST", body: { email, password } }),
  changePassword: (old_password, new_password) =>
    fetchApi("/api/employee/password", { method: "PUT", body: { old_password, new_password } }),
  list: ({ page, search, role, active } = {}) => fetchApi("/api/employees", { query: { page, search, role, active } }),
  // Active technicians for the assign list (managers only ever get these).
  technicians: () => fetchApi("/api/employees", { query: { role: 1, active: 1, page_size: 100 } }),
  get: (id) => fetchApi(`/api/employee/${id}`),
  create: (employee) => fetchApi("/api/employee", { method: "POST", body: employee }),
  update: (id, employee) => fetchApi(`/api/employee/${id}`, { method: "PUT", body: employee }),
};

export default employeeService;
