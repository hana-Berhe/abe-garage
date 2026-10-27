const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./callback.controller");

const { MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/public/callback", ah(controller.create));
router.get("/api/callbacks", verifyToken, hasRole([M, A]), ah(controller.list));
router.put("/api/callback/:id/called", verifyToken, hasRole([M, A]), ah(controller.markCalled));

module.exports = router;
