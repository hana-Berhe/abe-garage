const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./service.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/services", verifyToken, hasRole([A]), ah(controller.create));
router.get("/api/services", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.patch("/api/services/:id", verifyToken, hasRole([A]), ah(controller.update));
router.get("/api/public/services", ah(controller.listPublic));

module.exports = router;
