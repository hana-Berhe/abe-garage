// The one place the app calls fetch. Adds the token and logs out on 401.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TOKEN_KEY = "abe_garage_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Error thrown for any non-2xx answer. `field` points the form at the wrong input.
export class ApiError extends Error {
  constructor(httpStatus, message, data) {
    super(message);
    this.httpStatus = httpStatus;
    this.data = data;
    this.field = data && data.field;
  }
}

export async function fetchApi(path, { method = "GET", body, query } = {}) {
  const url = new URL(path, API_URL);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  const headers = { "Content-Type": "application/json" };
  const token = tokenStore.get();
  if (token) headers["x-access-token"] = token;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError(0, "Cannot reach the server. Check your connection.", null);
  }
  const json = await res.json().catch(() => ({ message: "Unexpected answer from the server", data: null }));
  if (res.status === 401 && token) onUnauthorized();
  if (!res.ok) throw new ApiError(res.status, json.message, json.data);
  return json.data;
}
