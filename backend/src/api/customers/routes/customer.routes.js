import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import { CAR } from "../../vehicles/validations/vehicle.validation.js";
import * as rules from "../validations/customer.validation.js";
import * as controller from "../controller/customer.controller.js";

const router = express.Router();

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/customers", verifyToken, hasRole([M, A]), allowFields(rules.CUSTOMER, { nested: { vehicle: CAR } }), validate(rules.createCustomer), ah(controller.create));
router.get("/api/customers", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.get("/api/customers/:id", verifyToken, hasRole([T, M, A]), validate(rules.customerId), ah(controller.getOne));
router.patch("/api/customers/:id", verifyToken, hasRole([M, A]), allowFields([...rules.CUSTOMER, "updated_at"]), validate(rules.updateCustomer), ah(controller.update));

export default router;
