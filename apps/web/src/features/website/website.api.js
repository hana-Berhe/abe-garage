import { fetchApi } from "../../shared/api/client";

const websiteApi = { garage: () => fetchApi("/api/public/garage") };

export default websiteApi;
