const installService = require("./install.service");
const { ok } = require("../../shared/respond");

async function install(req, res) {
  const data = await installService.install();
  return ok(res, "Installed. You can now log in as the admin.", data);
}

module.exports = { install };
