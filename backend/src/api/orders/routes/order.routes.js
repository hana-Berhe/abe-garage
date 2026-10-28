import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/order.validation.js";
import * as controller from "../controller/order.controller.js";

const router = express.Router();

const LINE = ["service_id", "price", "description"];

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/", verifyToken, hasRole([M, A]), allowFields(["customer_id", "vehicle_id", "mileage", ...rules.NOTES], { nested: { lines: LINE } }), validate(rules.createOrder), ah(controller.create));
router.get("/", verifyToken, hasRole([T, M, A]), validate(rules.listOrders), ah(controller.list));
router.get("/:id", verifyToken, hasRole([T, M, A]), validate(rules.orderId), ah(controller.getOne));
router.get("/:id/estimate", verifyToken, hasRole([M, A]), validate(rules.orderId), ah(controller.estimate));
router.patch("/:id", verifyToken, hasRole([M, A]), allowFields([...rules.NOTES, "updated_at"], { nested: { lines: ["line_id", ...LINE] } }), validate(rules.updateOrder), ah(controller.update));
router.post("/:id/lines", verifyToken, hasRole([M, A]), allowFields(LINE), validate(rules.addLine), ah(controller.addLine));
router.patch("/:id/approval", verifyToken, hasRole([M, A]), allowFields(["decision", "method", "note"]), validate(rules.approval), ah(controller.approval));

export default router;
