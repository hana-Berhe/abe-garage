// Every URL in the API, in one place. app.js mounts this under /api, so "/customers" here is /api/customers.
// Each route file holds only the part after its prefix ("/", "/:id", "/:id/vehicles").
// Each feature adds only its own lines here.
import express from "express";
import healthRoutes from "./api/health/routes/health.routes.js";
import installRoutes from "./api/install/routes/install.routes.js";
import loginRoutes from "./api/employees/routes/login.routes.js";
import profileRoutes from "./api/employees/routes/profile.routes.js";
import employeeRoutes from "./api/employees/routes/employee.routes.js";
import passwordResetRoutes from "./api/auth/routes/password-reset.routes.js";
import settingsRoutes from "./api/settings/routes/settings.routes.js";
import rolesRoutes from "./api/settings/routes/roles.routes.js";
import publicGarageRoutes from "./api/settings/routes/public-garage.routes.js";
import customerRoutes from "./api/customers/routes/customer.routes.js";
import customerVehicleRoutes from "./api/vehicles/routes/customer-vehicle.routes.js";
import vehicleRoutes from "./api/vehicles/routes/vehicle.routes.js";
import serviceRoutes from "./api/services/routes/service.routes.js";
import publicServiceRoutes from "./api/services/routes/public-service.routes.js";
import orderRoutes from "./api/orders/routes/order.routes.js";
import orderLineRoutes from "./api/orders/routes/order-line.routes.js";
import myJobsRoutes from "./api/orders/routes/my-jobs.routes.js";
import invoiceRoutes from "./api/invoices/routes/invoice.routes.js";
import publicRoutes from "./api/public/routes/public.routes.js";
import dashboardRoutes from "./api/dashboard/routes/dashboard.routes.js";

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/install", installRoutes);
router.use("/auth", loginRoutes);
router.use("/auth", passwordResetRoutes);
router.use("/profile", profileRoutes);
router.use("/employees", employeeRoutes);
router.use("/settings", settingsRoutes);
router.use("/roles", rolesRoutes);
router.use("/customers", customerRoutes);
router.use("/customers", customerVehicleRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/services", serviceRoutes);
router.use("/orders", orderRoutes);
router.use("/orders", invoiceRoutes);
router.use("/order-lines", orderLineRoutes);
router.use("/my-jobs", myJobsRoutes);
router.use("/public", publicRoutes);
router.use("/public", publicServiceRoutes);
router.use("/public", publicGarageRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
