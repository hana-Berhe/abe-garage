import { fetchApi } from "../../shared/api/client";

const customerService = {
  list: ({ page, search, active } = {}) => fetchApi("/api/customers", { query: { page, search, active } }),
  get: (id) => fetchApi(`/api/customers/${id}`),
  create: (customer) => fetchApi("/api/customers", { method: "POST", body: customer }),
  update: (id, customer) => fetchApi(`/api/customers/${id}`, { method: "PATCH", body: customer }),
  vehicles: (id) => fetchApi(`/api/customers/${id}/vehicles`),
};

export default customerService;
