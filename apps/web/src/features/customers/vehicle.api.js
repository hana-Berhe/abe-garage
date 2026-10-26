import { fetchApi } from "../../shared/api/client";

const vehicleService = {
  get: (id) => fetchApi(`/api/vehicle/${id}`),
  create: (vehicle) => fetchApi("/api/vehicle", { method: "POST", body: vehicle }),
  update: (id, vehicle) => fetchApi(`/api/vehicle/${id}`, { method: "PUT", body: vehicle }),
};

export default vehicleService;
