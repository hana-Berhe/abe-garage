import { fetchApi } from "../../shared/api/client";

// Call-back requests sent from the website form. Managers and the admin only.
const callbackApi = {
  list: (query) => fetchApi("/api/callbacks", { query }),
  markCalled: (id) => fetchApi(`/api/callbacks/${id}/called`, { method: "PATCH" }),
};

// The sidebar listens for this to refresh its "new" count.
export const CALLBACKS_CHANGED = "callbacks-changed";
export const tellCallbacksChanged = () => window.dispatchEvent(new Event(CALLBACKS_CHANGED));

export default callbackApi;
