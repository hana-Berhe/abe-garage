const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { allowFields } = require("../../middlewares/allow-fields");
const { CAR } = require("../vehicles/vehicle.validator");
const controller = require("./customer.controller");

const CUSTOMER = ["first_name", "last_name", "email", "phone", "active"];

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/customers", verifyToken, hasRole([M, A]), allowFields(CUSTOMER, { nested: { vehicle: CAR } }), ah(controller.create));
router.get("/api/customers", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.get("/api/customers/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.patch("/api/customers/:id", verifyToken, hasRole([M, A]), allowFields([...CUSTOMER, "updated_at"]), ah(controller.update));

module.exports = router;
