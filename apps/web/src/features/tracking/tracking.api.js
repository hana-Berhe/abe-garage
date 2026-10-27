import { fetchApi } from "../../shared/api/client";

const trackingApi = {
  orderStatus: (hash) => fetchApi(`/api/public/orders/${encodeURIComponent(hash)}`),
};

export default trackingApi;
