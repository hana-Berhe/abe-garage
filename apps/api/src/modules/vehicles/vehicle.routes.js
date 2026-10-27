const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { allowFields } = require("../../middlewares/allow-fields");
const { CAR } = require("./vehicle.validator");
const controller = require("./vehicle.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/vehicles", verifyToken, hasRole([M, A]), allowFields(["customer_id", ...CAR]), ah(controller.create));
router.get("/api/customers/:id/vehicles", verifyToken, hasRole([T, M, A]), ah(controller.listForCustomer));
router.get("/api/vehicles/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.get("/api/vehicles/:id/orders", verifyToken, hasRole([T, M, A]), ah(controller.listOrders));
router.patch("/api/vehicles/:id", verifyToken, hasRole([M, A]), allowFields([...CAR, "updated_at"]), ah(controller.update));

module.exports = router;
