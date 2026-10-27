import { fetchApi } from "../../shared/api/client";

const orderService = {
  list: ({ page, search, status, paid } = {}) => fetchApi("/api/orders", { query: { page, search, status, paid } }),
  get: (id) => fetchApi(`/api/orders/${id}`),
  // BE-039: only what is printed on the estimate.
  estimate: (id) => fetchApi(`/api/orders/${id}/estimate`),
  create: (order) => fetchApi("/api/orders", { method: "POST", body: order }),
  update: (id, order) => fetchApi(`/api/orders/${id}`, { method: "PATCH", body: order }),
  addLine: (id, line) => fetchApi(`/api/orders/${id}/lines`, { method: "POST", body: line }),
  approve: (id, method, note) => fetchApi(`/api/orders/${id}/approval`, { method: "PATCH", body: { decision: "approve", method, note } }),
  decline: (id, method, note) => fetchApi(`/api/orders/${id}/approval`, { method: "PATCH", body: { decision: "decline", method, note } }),
  assignTechnician: (lineId, technician_id) =>
    fetchApi(`/api/order-lines/${lineId}/technician`, { method: "PATCH", body: { technician_id } }),
  setLineStatus: (lineId, status, note) =>
    fetchApi(`/api/order-lines/${lineId}/status`, { method: "PATCH", body: note === undefined ? { status } : { status, note } }),
  saveLineNote: (lineId, note) => fetchApi(`/api/order-lines/${lineId}/note`, { method: "PATCH", body: { technician_note: note } }),
  myJobs: () => fetchApi("/api/my-jobs"),
};

export default orderService;

export const invoiceApi = {
  get: (id) => fetchApi(`/api/orders/${id}/invoice`),
  issue: (id) => fetchApi(`/api/orders/${id}/invoice`, { method: "POST" }),
  markPaid: (id) => fetchApi(`/api/orders/${id}/payment`, { method: "PATCH" }),
  resendEmail: (id) => fetchApi(`/api/orders/${id}/resend-email`, { method: "POST" }),
};
