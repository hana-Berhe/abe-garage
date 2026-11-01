import { validationResult } from "express-validator";
import { ApiError } from "../shared/respond.js";

// Runs a feature's express-validator chains and returns the errors as { <field>: <message> }:
// one message per field (the first failed check), in the order the chains list the fields, so the form
// shows the first one under its input. A field inside a list is named with dots, e.g. "lines.0.service_id",
// and a list's errors are grouped by item (every error of lines.0 before those of lines.1).
// The chains' sanitizers have already replaced the values in req.params, req.body and req.query.
async function check(chains, req) {
  for (const chain of chains) await chain.run(req);
  const issues = validationResult(req).array().map((issue) => {
    const field = issue.path.replace(/\[(\d+)\]/g, ".$1");
    const [root, index] = field.split(/\.(\d+)/);
    return { field, root, index: index === undefined ? -1 : Number(index), message: issue.msg };
  });
  const roots = [...new Set(issues.map((i) => i.root))];
  issues.sort((a, b) => roots.indexOf(a.root) - roots.indexOf(b.root) || a.index - b.index);
  const errors = {};
  for (const { field, message } of issues) if (!(field in errors)) errors[field] = message;
  return errors;
}

// Checks a request against a feature's chains (params, body and query together).
// When all pass, the controller reads clean input from req.params, req.body and req.query.
// Otherwise 400 in the app's format (BE-003):
//   { status: "error", message: "Validation failed", data: { errors: { <field>: <message> } } }
function validate(chains) {
  return (req, res, next) =>
    check(chains, req)
      .then((errors) => (Object.keys(errors).length ? next(new ApiError(400, "Validation failed", { errors })) : next()))
      .catch(next);
}

export { check, validate };
