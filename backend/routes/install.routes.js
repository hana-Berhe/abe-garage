const router = require("express").Router();
const ah = require("../utils/asyncHandler");
const controller = require("../controllers/install.controller");

router.get("/install", ah(controller.install));

module.exports = router;
