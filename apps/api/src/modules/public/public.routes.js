const router = require("express").Router();
const ah = require("../../shared/async-handler");
const { statusLimits } = require("../../middlewares/rate-limit");
const controller = require("./public.controller");

// The link works like a key, so answers (404s and 429s too) are never cached and never passed on as a referrer (BE-044).
function privateAnswer(req, res, next) {
  res.set("Cache-Control", "no-store");
  res.set("Referrer-Policy", "no-referrer");
  next();
}

// No token: the 32-character code in the link is the key (FR-TRK-01).
router.get("/api/public/orders/:hash", privateAnswer, statusLimits, ah(controller.orderStatus));

module.exports = router;
