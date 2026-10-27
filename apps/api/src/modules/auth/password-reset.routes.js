const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { forgotLimits, resetLimits } = require("../../middlewares/rate-limit");
const { allowFields } = require("../../middlewares/allow-fields");
const controller = require("./password-reset.controller");

// BE-005, BE-006. Public: the person can't log in yet.
router.post("/api/auth/forgot-password", forgotLimits, allowFields(["email"]), ah(controller.forgot));
router.post("/api/auth/reset-password", resetLimits, allowFields(["token", "new_password"]), ah(controller.reset));

module.exports = router;
