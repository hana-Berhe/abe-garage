import express from "express";
import ah from "../../../shared/async-handler.js";
import * as controller from "../controller/service.controller.js";

const router = express.Router();

router.get("/services", ah(controller.listPublic));

export default router;
