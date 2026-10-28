import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/order.validation.js";
import * as controller from "../controller/order.controller.js";

const router = express.Router();

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.patch("/:id/technician", verifyToken, hasRole([M, A]), allowFields(["technician_id"]), validate(rules.assignTechnician), ah(controller.assignTechnician));
// Technicians may only change their own jobs; the service checks that.
router.patch("/:id/status", verifyToken, hasRole([T, M, A]), allowFields(["status", "note"]), validate(rules.lineStatus), ah(controller.lineStatus));
router.patch("/:id/note", verifyToken, hasRole([T, M, A]), allowFields(["technician_note"]), validate(rules.lineNote), ah(controller.lineNote));

export default router;
