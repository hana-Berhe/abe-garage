const service = require("./password-reset.service");
const { ok } = require("../../shared/respond");
const v = require("../../shared/validate");

// The same answer whether or not the account exists, so the form can't be used to find staff emails.
const SAME_ANSWER = "If an eligible account exists, a password reset link will be sent.";

async function forgot(req, res) {
  const email = v.requireEmail(req.body);
  const message = await service.requestReset(email);
  ok(res, SAME_ANSWER, null);
  if (message) service.sendResetEmail(message);
}

async function reset(req, res) {
  const token = v.requireText(req.body, "token", "Reset link", 64);
  const newPassword = v.requirePassword(req.body, "new_password");
  await service.resetPassword(token, newPassword);
  return ok(res, "Password reset successfully. Please log in.", null);
}

module.exports = { forgot, reset };
