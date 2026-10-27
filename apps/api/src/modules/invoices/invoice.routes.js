const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./invoice.controller");

const { MANAGER: M, ADMIN: A } = ROLES;

router.get("/api/orders/:id/invoice", verifyToken, hasRole([M, A]), ah(controller.getInvoice));
router.patch("/api/orders/:id/payment", verifyToken, hasRole([M, A]), ah(controller.markPaid));
router.post("/api/orders/:id/resend-email", verifyToken, hasRole([M, A]), ah(controller.resendEmail));

module.exports = router;
