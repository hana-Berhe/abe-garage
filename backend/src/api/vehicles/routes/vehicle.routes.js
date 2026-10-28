import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import { validate } from "../../../middlewares/validate.js";
import * as rules from "../validations/vehicle.validation.js";
import * as controller from "../controller/vehicle.controller.js";

const router = express.Router();

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/vehicles", verifyToken, hasRole([M, A]), allowFields(["customer_id", ...rules.CAR]), validate(rules.createVehicle), ah(controller.create));
router.get("/api/customers/:id/vehicles", verifyToken, hasRole([T, M, A]), validate(rules.customerId), ah(controller.listForCustomer));
router.get("/api/vehicles/:id", verifyToken, hasRole([T, M, A]), validate(rules.vehicleId), ah(controller.getOne));
router.get("/api/vehicles/:id/orders", verifyToken, hasRole([T, M, A]), validate(rules.vehicleId), ah(controller.listOrders));
router.patch("/api/vehicles/:id", verifyToken, hasRole([M, A]), allowFields([...rules.CAR, "updated_at"]), validate(rules.updateVehicle), ah(controller.update));

export default router;
