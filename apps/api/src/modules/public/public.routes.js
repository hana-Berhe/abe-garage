const router = require("express").Router();
const ah = require("../../shared/async-handler");
const controller = require("./public.controller");

// No token: the 32-character code in the link is the key (FR-TRK-01).
router.get("/api/public/order/:hash", ah(controller.orderStatus));

module.exports = router;
