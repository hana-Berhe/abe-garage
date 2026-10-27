import { fetchApi } from "../../shared/api/client";

const vehicleService = {
  get: (id) => fetchApi(`/api/vehicles/${id}`),
  create: (vehicle) => fetchApi("/api/vehicles", { method: "POST", body: vehicle }),
  update: (id, vehicle) => fetchApi(`/api/vehicles/${id}`, { method: "PATCH", body: vehicle }),
};

export default vehicleService;
