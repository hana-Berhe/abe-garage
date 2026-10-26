const dashboardService = require("./dashboard.service");
const { ok } = require("../../shared/respond");

async function get(req, res) {
  return ok(res, "Dashboard", await dashboardService.getCounters());
}

module.exports = { get };
