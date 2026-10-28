import express from "express";
import ah from "../../../shared/async-handler.js";
import * as controller from "../controller/settings.controller.js";

const router = express.Router();

router.get("/garage", ah(controller.getPublic));

export default router;
