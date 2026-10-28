import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { loginLimits } from "../../../middlewares/rate-limit.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/employee.validation.js";
import * as controller from "../controller/employee.controller.js";

const router = express.Router();

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/login", loginLimits, allowFields(["email", "password"]), validate(rules.login), ah(controller.login));
router.patch("/password", verifyToken, hasRole([T, M, A]), allowFields(["old_password", "new_password"]), validate(rules.changePassword), ah(controller.changePassword));

export default router;
