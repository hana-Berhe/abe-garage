const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./vehicle.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/vehicles", verifyToken, hasRole([M, A]), ah(controller.create));
router.get("/api/customers/:id/vehicles", verifyToken, hasRole([T, M, A]), ah(controller.listForCustomer));
router.get("/api/vehicles/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.patch("/api/vehicles/:id", verifyToken, hasRole([M, A]), ah(controller.update));

module.exports = router;
