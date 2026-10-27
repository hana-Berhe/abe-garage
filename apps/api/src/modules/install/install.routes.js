const router = require("express").Router();
const ah = require("../../shared/async-handler");
const controller = require("./install.controller");

router.post("/api/install", ah(controller.install));

module.exports = router;
