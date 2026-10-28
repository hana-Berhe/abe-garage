import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import * as controller from "../controller/dashboard.controller.js";

const router = express.Router();

router.get("/", verifyToken, hasRole([ROLES.MANAGER, ROLES.ADMIN]), ah(controller.get));

export default router;
