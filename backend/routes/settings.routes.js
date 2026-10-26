const router = require("express").Router();
const ah = require("../utils/asyncHandler");
const { verifyToken, hasRole, ROLES } = require("../middlewares/auth");
const controller = require("../controllers/settings.controller");

router.get("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.get));
router.put("/api/settings", verifyToken, hasRole([ROLES.ADMIN]), ah(controller.update));

module.exports = router;
