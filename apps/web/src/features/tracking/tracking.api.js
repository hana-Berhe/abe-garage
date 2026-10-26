import { fetchApi } from "../../shared/api/client";

const trackingApi = {
  orderStatus: (hash) => fetchApi(`/api/public/order/${encodeURIComponent(hash)}`),
};

export default trackingApi;
