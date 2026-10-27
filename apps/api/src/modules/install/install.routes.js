const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { allowFields } = require("../../middlewares/allow-fields");
const controller = require("./install.controller");

// The setup key comes in the X-Setup-Key header; the body stays empty.
router.post("/api/install", allowFields([]), ah(controller.install));

module.exports = router;
