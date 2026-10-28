import express from "express";
import ah from "../../../shared/async-handler.js";
import { verifyToken, hasRole, ROLES } from "../../../middlewares/auth.js";
import * as controller from "../controller/order.controller.js";

const router = express.Router();

const { TECHNICIAN: T } = ROLES;

router.get("/", verifyToken, hasRole([T]), ah(controller.myJobs));

export default router;
