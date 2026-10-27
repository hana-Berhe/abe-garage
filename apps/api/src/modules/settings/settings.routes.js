const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./settings.controller");

router.get("/api/public/garage", ah(controller.getPublic));
router.get("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.get));
router.get("/api/roles", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.roles));
router.patch("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.update));

module.exports = router;
