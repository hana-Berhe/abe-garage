const installService = require("./install.service");
const { created } = require("../../shared/respond");

async function install(req, res) {
  const data = await installService.install(req.get("x-setup-key"));
  return created(res, "Installed. You can now log in as the admin.", data);
}

module.exports = { install };
