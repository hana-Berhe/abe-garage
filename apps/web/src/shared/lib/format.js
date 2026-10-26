import { format } from "date-fns";

export const money = (v) => `$${Number(v || 0).toFixed(2)}`;
export const date = (v) => (v ? format(new Date(v), "d MMM yyyy") : "–");
export const dateTime = (v) => (v ? format(new Date(v), "d MMM yyyy, HH:mm") : "–");
export const time = (v) => (v ? format(new Date(v), "HH:mm") : "");
export const initials = (first, last) => `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
export const invoiceNumber = (orderId) => `INV-${String(orderId).padStart(6, "0")}`;
