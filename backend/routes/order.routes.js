const router = require("express").Router();
const ah = require("../utils/asyncHandler");
const { verifyToken, hasRole, ROLES } = require("../middlewares/auth");
const controller = require("../controllers/order.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/order", verifyToken, hasRole([M, A]), ah(controller.create));
router.get("/api/orders", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.get("/api/order/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.put("/api/order/:id", verifyToken, hasRole([M, A]), ah(controller.update));
router.post("/api/order/:id/line", verifyToken, hasRole([M, A]), ah(controller.addLine));
router.put("/api/order/:id/approval", verifyToken, hasRole([M, A]), ah(controller.approval));
router.put("/api/order-line/:id/technician", verifyToken, hasRole([M, A]), ah(controller.assignTechnician));
// Technicians may only change their own jobs; the service checks that.
router.put("/api/order-line/:id/status", verifyToken, hasRole([T, M, A]), ah(controller.lineStatus));
router.get("/api/my-jobs", verifyToken, hasRole([T]), ah(controller.myJobs));

module.exports = router;
