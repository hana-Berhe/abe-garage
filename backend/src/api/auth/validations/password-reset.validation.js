import { body } from "express-validator";
import * as r from "../../../shared/rules.js";

const forgotPassword = [r.requireEmail(body("email"))];
const resetPassword = [r.requireText(body("token"), "Reset link", 64), r.requirePassword(body("new_password"))];

export { forgotPassword, resetPassword };
