import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/employee.validation.js";
import * as controller from "../controller/employee.controller.js";

const router = express.Router();
// BE-012: passwords change through Forgot password or Change password, never through employee edit.
const NO_PASSWORD = "Passwords can't be changed here. Use Forgot password to send a reset email.";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/", verifyToken, hasRole([A]), allowFields([...rules.PERSON, "password"]), validate(rules.createEmployee), ah(controller.create));
router.get("/", verifyToken, hasRole([M, A]), ah(controller.list));
router.get("/:id", verifyToken, hasRole([A]), validate(rules.employeeId), ah(controller.getOne));
router.patch("/:id", verifyToken, hasRole([A]), allowFields([...rules.PERSON, "updated_at"], { refused: { password: NO_PASSWORD } }), validate(rules.updateEmployee), ah(controller.update));

export default router;
