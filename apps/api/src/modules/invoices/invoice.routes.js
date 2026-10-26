const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./invoice.controller");

const { MANAGER: M, ADMIN: A } = ROLES;

router.get("/api/order/:id/invoice", verifyToken, hasRole([M, A]), ah(controller.getInvoice));
router.put("/api/order/:id/payment", verifyToken, hasRole([M, A]), ah(controller.markPaid));
router.post("/api/order/:id/resend-email", verifyToken, hasRole([M, A]), ah(controller.resendEmail));

module.exports = router;
