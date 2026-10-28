import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/vehicle.validation.js";
import * as controller from "../controller/vehicle.controller.js";

const router = express.Router();

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.get("/:id/vehicles", verifyToken, hasRole([T, M, A]), validate(rules.customerId), ah(controller.listForCustomer));

export default router;
