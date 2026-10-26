// Each module adds only its own line here.
const router = require("express").Router();

router.use(require("./install.routes"));
router.use(require("./employee.routes"));
router.use(require("./settings.routes"));

module.exports = router;
