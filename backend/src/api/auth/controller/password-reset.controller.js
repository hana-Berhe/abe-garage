import * as service from "../service/password-reset.service.js";
import { ok } from "../../../shared/respond.js";

// The same answer whether or not the account exists, so the form can't be used to find staff emails.
const SAME_ANSWER = "If an eligible account exists, a password reset link will be sent.";

async function forgot(req, res) {
  const message = await service.requestReset(req.body.email);
  ok(res, SAME_ANSWER, null);
  if (message) service.sendResetEmail(message);
}

async function reset(req, res) {
  await service.resetPassword(req.body.token, req.body.new_password);
  return ok(res, "Password reset successfully. Please log in.", null);
}

export { forgot, reset };
