import { ApiError } from "../shared/respond.js";

// Checks a request against a feature's Zod schemas: { params, body, query } (each optional).
// When all pass, the parsed values replace req.params, req.body and req.query, so the controller gets clean input.
// Otherwise 400 in the app's format (BE-003):
//   { status: "error", message: "Validation failed", data: { errors: { <field>: <message> } } }
// One message per field, in the order the schema lists them, so the form shows the first one under its input.
// A field inside a list is named with dots, e.g. "lines.0.service_id".
function validate(schemas) {
  return (req, res, next) => {
    const errors = {};
    const parsed = {};
    for (const part of ["params", "body", "query"]) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (result.success) {
        parsed[part] = result.data;
        continue;
      }
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!(field in errors)) errors[field] = issue.message;
      }
    }
    if (Object.keys(errors).length) return next(new ApiError(400, "Validation failed", { errors }));
    Object.assign(req, parsed);
    return next();
  };
}

export { validate };
