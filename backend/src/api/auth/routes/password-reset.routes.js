import express from "express";
import ah from "../../../shared/async-handler.js";
import { forgotLimits, resetLimits } from "../../../middlewares/rate-limit.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import * as controller from "../controller/password-reset.controller.js";

const router = express.Router();

// BE-005, BE-006. Public: the person can't log in yet.
router.post("/api/auth/forgot-password", forgotLimits, allowFields(["email"]), ah(controller.forgot));
router.post("/api/auth/reset-password", resetLimits, allowFields(["token", "new_password"]), ah(controller.reset));

export default router;
