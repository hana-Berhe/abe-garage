import * as installService from "../service/install.service.js";
import { created } from "../../../shared/respond.js";

async function install(req, res) {
  const data = await installService.install(req.get("x-setup-key"));
  return created(res, "Installed. You can now log in as the admin.", data);
}

export { install };
