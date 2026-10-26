// Each module adds only its own line here.
const router = require("express").Router();

router.use(require("./install.routes"));
router.use(require("./employee.routes"));
router.use(require("./settings.routes"));
router.use(require("./customer.routes"));
router.use(require("./vehicle.routes"));

module.exports = router;
