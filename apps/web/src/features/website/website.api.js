import { fetchApi } from "../../shared/api/client";

const websiteApi = {
  garage: () => fetchApi("/api/public/garage"),
  // "Request a call back" form. No login needed.
  requestCallback: (body) => fetchApi("/api/public/callback", { method: "POST", body }),
};

export default websiteApi;
