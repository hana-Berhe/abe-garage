const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { loginLimits } = require("../../middlewares/rate-limit");
const controller = require("./employee.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/auth/login", loginLimits, ah(controller.login));
router.patch("/api/auth/password", verifyToken, hasRole([T, M, A]), ah(controller.changePassword));
router.post("/api/employees", verifyToken, hasRole([A]), ah(controller.create));
router.get("/api/employees", verifyToken, hasRole([M, A]), ah(controller.list));
router.get("/api/employees/:id", verifyToken, hasRole([A]), ah(controller.getOne));
router.patch("/api/employees/:id", verifyToken, hasRole([A]), ah(controller.update));

module.exports = router;
