import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { resendLimits } from "../../../middlewares/rate-limit.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import * as controller from "../controller/invoice.controller.js";

const router = express.Router();

const NO_BODY = allowFields([]);

const { MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/orders/:id/invoice", verifyToken, hasRole([M, A]), NO_BODY, ah(controller.issue));
router.get("/api/orders/:id/invoice", verifyToken, hasRole([M, A]), ah(controller.getInvoice));
router.patch("/api/orders/:id/payment", verifyToken, hasRole([M, A]), allowFields(["paid"]), ah(controller.markPaid));
router.post("/api/orders/:id/resend-email", verifyToken, hasRole([M, A]), resendLimits, NO_BODY, ah(controller.resendEmail));

export default router;
