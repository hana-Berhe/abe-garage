const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { allowFields } = require("../../middlewares/allow-fields");
const controller = require("./settings.controller");

const SETTINGS = ["name", "address", "phone", "email", "vat_rate", "opening_time", "closing_time", "updated_at"];

router.get("/api/public/garage", ah(controller.getPublic));
router.get("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.get));
router.get("/api/roles", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.roles));
router.patch("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), allowFields(SETTINGS), ah(controller.update));

module.exports = router;
