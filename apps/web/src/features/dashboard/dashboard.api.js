import { fetchApi } from "../../shared/api/client";

const dashboardApi = { get: () => fetchApi("/api/dashboard") };

export default dashboardApi;
