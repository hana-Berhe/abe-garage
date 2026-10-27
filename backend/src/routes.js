// Each feature adds only its own lines here.
import express from "express";
import healthRoutes from "./api/health/routes/health.routes.js";
import installRoutes from "./api/install/routes/install.routes.js";
import employeeRoutes from "./api/employees/routes/employee.routes.js";
import passwordResetRoutes from "./api/auth/routes/password-reset.routes.js";
import settingsRoutes from "./api/settings/routes/settings.routes.js";
import customerRoutes from "./api/customers/routes/customer.routes.js";
import vehicleRoutes from "./api/vehicles/routes/vehicle.routes.js";
import serviceRoutes from "./api/services/routes/service.routes.js";
import orderRoutes from "./api/orders/routes/order.routes.js";
import invoiceRoutes from "./api/invoices/routes/invoice.routes.js";
import publicRoutes from "./api/public/routes/public.routes.js";
import dashboardRoutes from "./api/dashboard/routes/dashboard.routes.js";

const router = express.Router();

router.use(healthRoutes);
router.use(installRoutes);
router.use(employeeRoutes);
router.use(passwordResetRoutes);
router.use(settingsRoutes);
router.use(customerRoutes);
router.use(vehicleRoutes);
router.use(serviceRoutes);
router.use(orderRoutes);
router.use(invoiceRoutes);
router.use(publicRoutes);
router.use(dashboardRoutes);

export default router;
