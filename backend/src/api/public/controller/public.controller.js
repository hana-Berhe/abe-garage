import * as publicService from "../service/public.service.js";
import { ok } from "../../../shared/respond.js";

async function orderStatus(req, res) {
  return ok(res, "Order status", await publicService.getOrderStatus(String(req.params.hash).toLowerCase()));
}

export { orderStatus };
