const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { verifyToken, hasRole, ROLES } = require("../../middlewares/auth");
const controller = require("./order.controller");

const { TECHNICIAN: T, MANAGER: M, ADMIN: A } = ROLES;

router.post("/api/orders", verifyToken, hasRole([M, A]), ah(controller.create));
router.get("/api/orders", verifyToken, hasRole([T, M, A]), ah(controller.list));
router.get("/api/orders/:id", verifyToken, hasRole([T, M, A]), ah(controller.getOne));
router.get("/api/orders/:id/estimate", verifyToken, hasRole([M, A]), ah(controller.estimate));
router.patch("/api/orders/:id", verifyToken, hasRole([M, A]), ah(controller.update));
router.post("/api/orders/:id/lines", verifyToken, hasRole([M, A]), ah(controller.addLine));
router.patch("/api/orders/:id/approval", verifyToken, hasRole([M, A]), ah(controller.approval));
router.patch("/api/order-lines/:id/technician", verifyToken, hasRole([M, A]), ah(controller.assignTechnician));
// Technicians may only change their own jobs; the service checks that.
router.patch("/api/order-lines/:id/status", verifyToken, hasRole([T, M, A]), ah(controller.lineStatus));
router.patch("/api/order-lines/:id/note", verifyToken, hasRole([T, M, A]), ah(controller.lineNote));
router.get("/api/my-jobs", verifyToken, hasRole([T]), ah(controller.myJobs));

module.exports = router;
