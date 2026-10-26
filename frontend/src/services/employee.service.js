import { fetchApi } from "./api";

const employeeService = {
  login: (email, password) => fetchApi("/api/employee/login", { method: "POST", body: { email, password } }),
  changePassword: (old_password, new_password) =>
    fetchApi("/api/employee/password", { method: "PUT", body: { old_password, new_password } }),
  list: ({ page, search, role } = {}) => fetchApi("/api/employees", { query: { page, search, role } }),
  get: (id) => fetchApi(`/api/employee/${id}`),
  create: (employee) => fetchApi("/api/employee", { method: "POST", body: employee }),
  update: (id, employee) => fetchApi(`/api/employee/${id}`, { method: "PUT", body: employee }),
};

export default employeeService;
