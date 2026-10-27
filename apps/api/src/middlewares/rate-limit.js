const rateLimit = require("express-rate-limit");
const { ApiError } = require("../shared/respond");

const WINDOW_MINUTES = 15;

// 429 in the usual { status, message, data } shape. express-rate-limit also sets Retry-After (seconds).
function tooMany(message) {
  return (req, res, next) => next(new ApiError(429, message));
}

// BE-004: a script cannot keep guessing passwords.
// 5 wrong passwords for one email from one address, then wait; a correct login does not count.
const loginFailures = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}|${String(req.body?.email || "").trim().toLowerCase()}`,
  handler: tooMany(`Too many wrong passwords. Try again in ${WINDOW_MINUTES} minutes.`),
});

// And at most 30 login tries of any kind from one address, so a script cannot walk through many emails.
const loginAttempts = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooMany(`Too many login attempts. Try again in ${WINDOW_MINUTES} minutes.`),
});

// BE-005: at most 3 reset emails per address asked for, and 10 requests from one address, every 15 minutes.
const forgotPerEmail = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  limit: 3,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  keyGenerator: (req) => `forgot|${String(req.body?.email || "").trim().toLowerCase()}`,
  handler: tooMany(`Too many reset requests. Try again in ${WINDOW_MINUTES} minutes.`),
});
const forgotPerAddress = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooMany(`Too many reset requests. Try again in ${WINDOW_MINUTES} minutes.`),
});

// BE-006: 10 tries of a reset link from one address every 15 minutes, so links can't be guessed.
const resetAttempts = rateLimit({
  windowMs: WINDOW_MINUTES * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: tooMany(`Too many attempts. Try again in ${WINDOW_MINUTES} minutes.`),
});

module.exports = {
  loginLimits: [loginAttempts, loginFailures],
  forgotLimits: [forgotPerAddress, forgotPerEmail],
  resetLimits: [resetAttempts],
};
