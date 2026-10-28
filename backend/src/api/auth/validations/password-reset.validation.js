import { z } from "zod";
import * as r from "../../../shared/rules.js";

const forgotPassword = { body: z.object({ email: r.requireEmail() }) };
const resetPassword = { body: z.object({ token: r.requireText("Reset link", 64), new_password: r.requirePassword() }) };

export { forgotPassword, resetPassword };
