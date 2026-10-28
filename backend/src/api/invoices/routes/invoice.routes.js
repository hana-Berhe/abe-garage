import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { resendLimits } from "../../../middlewares/rate-limit.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/invoice.validation.js";
import * as controller from "../controller/invoice.controller.js";

const router = express.Router();

const NO_BODY = allowFields([]);
const ORDER_ID = validate(rules.orderId);

const { MANAGER: M, ADMIN: A } = ROLES;

router.post("/:id/invoice", verifyToken, hasRole([M, A]), NO_BODY, ORDER_ID, ah(controller.issue));
router.get("/:id/invoice", verifyToken, hasRole([M, A]), ORDER_ID, ah(controller.getInvoice));
router.patch("/:id/payment", verifyToken, hasRole([M, A]), allowFields(["paid"]), validate(rules.markPaid), ah(controller.markPaid));
router.post("/:id/resend-email", verifyToken, hasRole([M, A]), resendLimits, NO_BODY, ORDER_ID, ah(controller.resendEmail));

export default router;
