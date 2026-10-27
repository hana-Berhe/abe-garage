const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const { loginLimits } = require("../../middlewares/rate-limit");
const { allowFields } = require("../../middlewares/allow-fields");
const controller = require("./employee.controller");

const PERSON = ["email", "first_name", "last_name", "phone", "role_id", "active"];
// BE-012: passwords change through Forgot password or Change password, never through employee edit.
const NO_PASSWORD = "Passwords can't be changed here. Use Forgot password to send a reset email.";

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/auth/login", loginLimits, allowFields(["email", "password"]), ah(controller.login));
router.patch("/api/auth/password", verifyToken, hasRole([T, M, A]), allowFields(["old_password", "new_password"]), ah(controller.changePassword));
router.get("/api/profile", verifyToken, hasRole([T, M, A]), ah(controller.profile));
router.post("/api/employees", verifyToken, hasRole([A]), allowFields([...PERSON, "password"]), ah(controller.create));
router.get("/api/employees", verifyToken, hasRole([M, A]), ah(controller.list));
router.get("/api/employees/:id", verifyToken, hasRole([A]), ah(controller.getOne));
router.patch("/api/employees/:id", verifyToken, hasRole([A]), allowFields([...PERSON, "updated_at"], { refused: { password: NO_PASSWORD } }), ah(controller.update));

module.exports = router;
