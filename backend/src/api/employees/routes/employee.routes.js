import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { loginLimits } from "../../../middlewares/rate-limit.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/employee.validation.js";
import * as controller from "../controller/employee.controller.js";

const router = express.Router();
// BE-012: passwords change through Forgot password or Change password, never through employee edit.
const NO_PASSWORD = "Passwords can't be changed here. Use Forgot password to send a reset email.";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/auth/login", loginLimits, allowFields(["email", "password"]), validate(rules.login), ah(controller.login));
router.patch("/api/auth/password", verifyToken, hasRole([T, M, A]), allowFields(["old_password", "new_password"]), validate(rules.changePassword), ah(controller.changePassword));
router.get("/api/profile", verifyToken, hasRole([T, M, A]), ah(controller.profile));
router.post("/api/employees", verifyToken, hasRole([A]), allowFields([...rules.PERSON, "password"]), validate(rules.createEmployee), ah(controller.create));
router.get("/api/employees", verifyToken, hasRole([M, A]), ah(controller.list));
router.get("/api/employees/:id", verifyToken, hasRole([A]), validate(rules.employeeId), ah(controller.getOne));
router.patch("/api/employees/:id", verifyToken, hasRole([A]), allowFields([...rules.PERSON, "updated_at"], { refused: { password: NO_PASSWORD } }), validate(rules.updateEmployee), ah(controller.update));

export default router;
