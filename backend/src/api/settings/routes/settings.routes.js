import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/settings.validation.js";
import * as controller from "../controller/settings.controller.js";

const router = express.Router();

router.get("/api/public/garage", ah(controller.getPublic));
router.get("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.get));
router.get("/api/roles", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.roles));
router.patch("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), allowFields([...rules.SETTINGS, "updated_at"]), validate(rules.updateSettings), ah(controller.update));

export default router;
