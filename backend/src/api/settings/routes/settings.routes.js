import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import * as controller from "../controller/settings.controller.js";

const router = express.Router();

const SETTINGS = ["name", "address", "phone", "email", "vat_rate", "opening_time", "closing_time", "updated_at"];

router.get("/api/public/garage", ah(controller.getPublic));
router.get("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.get));
router.get("/api/roles", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.roles));
router.patch("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), allowFields(SETTINGS), ah(controller.update));

export default router;
