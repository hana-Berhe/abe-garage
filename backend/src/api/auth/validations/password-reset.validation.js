import * as r from "../../../shared/rules.js";

const forgotPassword = [r.requireEmail()];
const resetPassword = [r.requireText("token", "Reset link", 64), r.requirePassword("new_password")];

export { forgotPassword, resetPassword };
