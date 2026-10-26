const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./customer.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/customer", verifyToken, hasRole([M, A]), ah(controller.create));
router.get("/api/customers", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.get("/api/customer/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.put("/api/customer/:id", verifyToken, hasRole([M, A]), ah(controller.update));

module.exports = router;
