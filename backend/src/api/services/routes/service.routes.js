import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import * as controller from "../controller/service.controller.js";

const router = express.Router();

const SERVICE = ["name", "description", "price", "labor_hours", "active"];

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/services", verifyToken, hasRole([A]), allowFields(SERVICE), ah(controller.create));
router.get("/api/services", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.patch("/api/services/:id", verifyToken, hasRole([A]), allowFields([...SERVICE, "updated_at"]), ah(controller.update));
router.get("/api/public/services", ah(controller.listPublic));

export default router;
