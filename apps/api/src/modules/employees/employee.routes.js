const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./employee.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/employee/login", ah(controller.login));
router.put("/api/employee/password", verifyToken, hasRole([T, M, A]), ah(controller.changePassword));
router.post("/api/employee", verifyToken, hasRole([A]), ah(controller.create));
router.get("/api/employees", verifyToken, hasRole([M, A]), ah(controller.list));
router.get("/api/employee/:id", verifyToken, hasRole([A]), ah(controller.getOne));
router.put("/api/employee/:id", verifyToken, hasRole([A]), ah(controller.update));

module.exports = router;
