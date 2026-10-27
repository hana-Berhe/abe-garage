import * as dashboardService from "../service/dashboard.service.js";
import { ok } from "../../../shared/respond.js";

async function get(req, res) {
  return ok(res, "Dashboard", await dashboardService.getCounters());
}

export { get };
