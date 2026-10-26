import { fetchApi } from "../../shared/api/client";

const serviceService = {
  list: () => fetchApi("/api/services"),
  listPublic: () => fetchApi("/api/public/services"),
  create: (service) => fetchApi("/api/service", { method: "POST", body: service }),
  update: (id, service) => fetchApi(`/api/service/${id}`, { method: "PUT", body: service }),
};

export default serviceService;
