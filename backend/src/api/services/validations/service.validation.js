import { z } from "zod";
import * as r from "../../../shared/rules.js";

const SERVICE = ["name", "description", "price", "labor_hours", "active"];

const serviceShape = () => ({
  labor_hours: z.preprocess(
    (value) => (r.isEmpty(value) ? 0 : Number(value)),
    z.any()
      .refine((hours) => Number.isFinite(hours) && hours >= 0 && hours <= 99, "Hours must be a number from 0 to 99")
      .transform((hours) => hours.toFixed(2))
  ),
  name: r.requireText("Service name", 100),
  description: r.optionalText("Description", 2000),
  price: r.money("Price"),
  active: r.flag("Active"),
});

const createService = { body: z.object(serviceShape()) };
const updateService = { params: r.idParams("Service id"), body: r.editable(serviceShape(), { fields: SERVICE }) };

export { SERVICE, createService, updateService };
