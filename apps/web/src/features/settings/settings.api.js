import { fetchApi } from "../../shared/api/client";

const settingsService = {
  get: () => fetchApi("/api/settings"),
  update: (settings) => fetchApi("/api/settings", { method: "PUT", body: settings }),
};

export default settingsService;
