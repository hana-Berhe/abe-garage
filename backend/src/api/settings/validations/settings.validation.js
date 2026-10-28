import { z } from "zod";
import * as r from "../../../shared/rules.js";

const SETTINGS = ["name", "address", "phone", "email", "vat_rate", "opening_time", "closing_time"];

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const time = (label, required) =>
  z.preprocess(
    r.emptyToNull,
    z.any()
      .refine((value) => value !== null || !required, `${label} is required`)
      .refine((value) => value === null || TIME_RE.test(value), `${label} must look like 08:00`)
  );

// Settings are only ever edited, so every field may be left out. The closing time is checked against the
// opening time in the controller, because one of them may be the saved value.
const updateSettings = {
  body: r.editable({
    vat_rate: z.any()
      .refine((value) => value !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 100, "VAT rate must be a number from 0 to 100")
      .transform((value) => Number(value).toFixed(2)),
    opening_time: time("Opening time", true),
    closing_time: time("Closing time", false),
    name: r.requireText("Garage name", 100),
    address: r.optionalText("Address"),
    phone: r.optionalText("Phone", 30),
    // The email may be cleared: "" or null is saved as null.
    email: z.preprocess((value) => value || null, r.requireEmail().nullable()),
  }, { fields: SETTINGS }),
};

export { SETTINGS, updateSettings };
