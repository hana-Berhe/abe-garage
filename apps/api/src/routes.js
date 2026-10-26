// Each module adds only its own line here.
const router = require("express").Router();

router.use(require("./modules/install/install.routes"));
router.use(require("./modules/employees/employee.routes"));
router.use(require("./modules/settings/settings.routes"));
router.use(require("./modules/customers/customer.routes"));
router.use(require("./modules/vehicles/vehicle.routes"));
router.use(require("./modules/services/service.routes"));
router.use(require("./modules/orders/order.routes"));

module.exports = router;
