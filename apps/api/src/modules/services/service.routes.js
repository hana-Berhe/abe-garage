const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { allowFields } = require("../../middlewares/allow-fields");
const controller = require("./service.controller");

const SERVICE = ["name", "description", "price", "labor_hours", "active"];

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/services", verifyToken, hasRole([A]), allowFields(SERVICE), ah(controller.create));
router.get("/api/services", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.patch("/api/services/:id", verifyToken, hasRole([A]), allowFields([...SERVICE, "updated_at"]), ah(controller.update));
router.get("/api/public/services", ah(controller.listPublic));

module.exports = router;
