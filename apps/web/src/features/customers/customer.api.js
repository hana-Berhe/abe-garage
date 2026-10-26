import { fetchApi } from "../../shared/api/client";

const customerService = {
  list: ({ page, search, active } = {}) => fetchApi("/api/customers", { query: { page, search, active } }),
  get: (id) => fetchApi(`/api/customer/${id}`),
  create: (customer) => fetchApi("/api/customer", { method: "POST", body: customer }),
  update: (id, customer) => fetchApi(`/api/customer/${id}`, { method: "PUT", body: customer }),
  vehicles: (id) => fetchApi(`/api/customer/${id}/vehicles`),
};

export default customerService;
