import { fetchApi } from "../../shared/api/client";

const serviceService = {
  list: () => fetchApi("/api/services"),
  listPublic: () => fetchApi("/api/public/services"),
  create: (service) => fetchApi("/api/services", { method: "POST", body: service }),
  update: (id, service) => fetchApi(`/api/services/${id}`, { method: "PATCH", body: service }),
};

export default serviceService;
