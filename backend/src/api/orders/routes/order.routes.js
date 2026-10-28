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

router.post("/api/orders", verifyToken, hasRole([M, A]), allowFields(["customer_id", "vehicle_id", "mileage", ...rules.NOTES], { nested: { lines: LINE } }), validate(rules.createOrder), ah(controller.create));
router.get("/api/orders", verifyToken, hasRole([T, M, A]), validate(rules.listOrders), ah(controller.list));
router.get("/api/orders/:id", verifyToken, hasRole([T, M, A]), validate(rules.orderId), ah(controller.getOne));
router.get("/api/orders/:id/estimate", verifyToken, hasRole([M, A]), validate(rules.orderId), ah(controller.estimate));
router.patch("/api/orders/:id", verifyToken, hasRole([M, A]), allowFields([...rules.NOTES, "updated_at"], { nested: { lines: ["line_id", ...LINE] } }), validate(rules.updateOrder), ah(controller.update));
router.post("/api/orders/:id/lines", verifyToken, hasRole([M, A]), allowFields(LINE), validate(rules.addLine), ah(controller.addLine));
router.patch("/api/orders/:id/approval", verifyToken, hasRole([M, A]), allowFields(["decision", "method", "note"]), validate(rules.approval), ah(controller.approval));
router.patch("/api/order-lines/:id/technician", verifyToken, hasRole([M, A]), allowFields(["technician_id"]), validate(rules.assignTechnician), ah(controller.assignTechnician));
// Technicians may only change their own jobs; the service checks that.
router.patch("/api/order-lines/:id/status", verifyToken, hasRole([T, M, A]), allowFields(["status", "note"]), validate(rules.lineStatus), ah(controller.lineStatus));
router.patch("/api/order-lines/:id/note", verifyToken, hasRole([T, M, A]), allowFields(["technician_note"]), validate(rules.lineNote), ah(controller.lineNote));
router.get("/api/my-jobs", verifyToken, hasRole([T]), ah(controller.myJobs));

export default router;
