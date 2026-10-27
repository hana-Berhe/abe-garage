import { fetchApi } from "../../shared/api/client";

// BE-005, BE-006. No login needed.
const authApi = {
  forgotPassword: (email) => fetchApi("/api/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, newPassword) =>
    fetchApi("/api/auth/reset-password", { method: "POST", body: { token, new_password: newPassword } }),
};

export default authApi;
