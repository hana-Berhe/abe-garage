const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { forgotLimits, resetLimits } = require("../../middlewares/rate-limit");
const controller = require("./password-reset.controller");

// BE-005, BE-006. Public: the person can't log in yet.
router.post("/api/auth/forgot-password", forgotLimits, ah(controller.forgot));
router.post("/api/auth/reset-password", resetLimits, ah(controller.reset));

module.exports = router;
