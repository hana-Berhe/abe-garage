import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import * as controller from "../controller/order.controller.js";

const router = express.Router();

const LINE = ["service_id", "price", "description"];
const NOTES = ["estimated_ready_date", "notes_for_customer", "internal_notes"];

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/orders", verifyToken, hasRole([M, A]), allowFields(["customer_id", "vehicle_id", "mileage", ...NOTES], { nested: { lines: LINE } }), ah(controller.create));
router.get("/api/orders", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.get("/api/orders/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.get("/api/orders/:id/estimate", verifyToken, hasRole([M, A]), ah(controller.estimate));
router.patch("/api/orders/:id", verifyToken, hasRole([M, A]), allowFields([...NOTES, "updated_at"], { nested: { lines: ["line_id", ...LINE] } }), ah(controller.update));
router.post("/api/orders/:id/lines", verifyToken, hasRole([M, A]), allowFields(LINE), ah(controller.addLine));
router.patch("/api/orders/:id/approval", verifyToken, hasRole([M, A]), allowFields(["decision", "method", "note"]), ah(controller.approval));
router.patch("/api/order-lines/:id/technician", verifyToken, hasRole([M, A]), allowFields(["technician_id"]), ah(controller.assignTechnician));
// Technicians may only change their own jobs; the service checks that.
router.patch("/api/order-lines/:id/status", verifyToken, hasRole([T, M, A]), allowFields(["status", "note"]), ah(controller.lineStatus));
router.patch("/api/order-lines/:id/note", verifyToken, hasRole([T, M, A]), allowFields(["technician_note"]), ah(controller.lineNote));
router.get("/api/my-jobs", verifyToken, hasRole([T]), ah(controller.myJobs));

export default router;
