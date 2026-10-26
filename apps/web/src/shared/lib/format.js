import { format } from "date-fns";

export const money = (v) => `$${Number(v || 0).toFixed(2)}`;
export const date = (v) => (v ? format(new Date(v), "d MMM yyyy") : "–");
export const dateTime = (v) => (v ? format(new Date(v), "d MMM yyyy, HH:mm") : "–");
export const time = (v) => (v ? format(new Date(v), "HH:mm") : "");
export const initials = (first, last) => `${(first || "")[0] || ""}${(last || "")[0] || ""}`.toUpperCase();
export const invoiceNumber = (orderId) => `INV-${String(orderId).padStart(6, "0")}`;

// "08:00" -> "8:00 AM"
export const hour12 = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

export const openingHours = (g) =>
  g.opening_time ? `Open from ${hour12(g.opening_time)}${g.closing_time ? ` to ${hour12(g.closing_time)}` : ""}` : "";

export const telHref = (phone) => `tel:${(phone || "").replace(/[^+\d]/g, "")}`;
