import { z } from "zod";
import * as r from "../../../shared/rules.js";

const orderId = { params: r.idParams("Order id") };

// BE-042: the body may be { "paid": true } (or empty). Nothing else: no partial payment or undo.
const markPaid = {
  params: r.idParams("Order id"),
  body: z.object({ paid: z.literal(true, { error: "Only paid: true can be recorded" }).optional() }),
};

export { orderId, markPaid };
