const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { resendLimits } = require("../../middlewares/rate-limit");
const { allowFields } = require("../../middlewares/allow-fields");
const controller = require("./invoice.controller");

const NO_BODY = allowFields([]);

const { MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/orders/:id/invoice", verifyToken, hasRole([M, A]), NO_BODY, ah(controller.issue));
router.get("/api/orders/:id/invoice", verifyToken, hasRole([M, A]), ah(controller.getInvoice));
router.patch("/api/orders/:id/payment", verifyToken, hasRole([M, A]), allowFields(["paid"]), ah(controller.markPaid));
router.post("/api/orders/:id/resend-email", verifyToken, hasRole([M, A]), resendLimits, NO_BODY, ah(controller.resendEmail));

module.exports = router;
