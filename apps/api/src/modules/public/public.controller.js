const publicService = require("./public.service");
const { ok } = require("../../shared/respond");

async function orderStatus(req, res) {
  return ok(res, "Order status", await publicService.getOrderStatus(String(req.params.hash).toLowerCase()));
}

module.exports = { orderStatus };
