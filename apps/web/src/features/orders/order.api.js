import { fetchApi } from "../../shared/api/client";

const orderService = {
  list: ({ page, search, status, paid } = {}) => fetchApi("/api/orders", { query: { page, search, status, paid } }),
  get: (id) => fetchApi(`/api/order/${id}`),
  create: (order) => fetchApi("/api/order", { method: "POST", body: order }),
  update: (id, order) => fetchApi(`/api/order/${id}`, { method: "PUT", body: order }),
  addLine: (id, line) => fetchApi(`/api/order/${id}/line`, { method: "POST", body: line }),
  approve: (id, method, note) => fetchApi(`/api/order/${id}/approval`, { method: "PUT", body: { decision: "approve", method, note } }),
  decline: (id, method, note) => fetchApi(`/api/order/${id}/approval`, { method: "PUT", body: { decision: "decline", method, note } }),
  assignTechnician: (lineId, technician_id) =>
    fetchApi(`/api/order-line/${lineId}/technician`, { method: "PUT", body: { technician_id } }),
  setLineStatus: (lineId, status, note) =>
    fetchApi(`/api/order-line/${lineId}/status`, { method: "PUT", body: note === undefined ? { status } : { status, note } }),
  saveLineNote: (lineId, note) => fetchApi(`/api/order-line/${lineId}/status`, { method: "PUT", body: { note } }),
  myJobs: () => fetchApi("/api/my-jobs"),
};

export default orderService;

export const invoiceApi = {
  get: (id) => fetchApi(`/api/order/${id}/invoice`),
  markPaid: (id) => fetchApi(`/api/order/${id}/payment`, { method: "PUT" }),
  resendEmail: (id) => fetchApi(`/api/order/${id}/resend-email`, { method: "POST" }),
};
