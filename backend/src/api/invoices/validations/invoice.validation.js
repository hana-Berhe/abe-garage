import { body, param } from "express-validator";
import * as r from "../../../shared/rules.js";

const orderId = [r.requireId("id", "Order id", param)];

// BE-042: the body may be { "paid": true } (or empty). Nothing else: no partial payment or undo.
const markPaid = [...orderId, body("paid").optional().custom((paid) => paid === true).withMessage("Only paid: true can be recorded")];

export { orderId, markPaid };
