import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import * as controller from "../controller/employee.controller.js";

const router = express.Router();

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.get("/", verifyToken, hasRole([T, M, A]), ah(controller.profile));

export default router;
