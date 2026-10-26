const installService = require("../services/install.service");
const { ok } = require("../utils/respond");

async function install(req, res) {
  const data = await installService.install();
  return ok(res, "Installed. You can now log in as the admin.", data);
}

module.exports = { install };
