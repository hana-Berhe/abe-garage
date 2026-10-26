const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./dashboard.controller");

router.get("/api/dashboard", verifyToken, hasRole([ROLES.MANAGER, ROLES.ADMIN]), ah(controller.get));

module.exports = router;
