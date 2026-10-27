import express from "express";
import ah from "../../../shared/async-handler.js";
import { allowFields } from "../../../middlewares/allow-fields.js";
import * as controller from "../controller/install.controller.js";

const router = express.Router();

// The setup key comes in the X-Setup-Key header; the body stays empty.
router.post("/api/install", allowFields([]), ah(controller.install));

export default router;
