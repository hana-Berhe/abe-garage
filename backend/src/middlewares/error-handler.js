import { ApiError, send } from "../shared/respond.js";

function notFound(req, res) {
  return send(res, 404, "Not found");
}

// BE-003: an error about one field answers { errors: { <field>: <message> } }; a 400 of that kind says "Validation failed".
function sendApiError(res, err) {
  if (!err.data || !err.data.field) return send(res, err.httpStatus, err.message, err.data);
  const { field, ...rest } = err.data;
  const message = err.httpStatus === 400 ? "Validation failed" : err.message;
  return send(res, err.httpStatus, message, { ...rest, errors: { [field]: err.message } });
}

// One shared handler so no request hangs and every error is { status, message, data }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) return sendApiError(res, err);
  if (err.type === "entity.parse.failed") return send(res, 400, "Request body is not valid JSON");
  if (err.type === "entity.too.large") return send(res, 413, "The request is too large");
  if (err.code === "ER_DUP_ENTRY") return send(res, 409, "This record already exists");
  if (err.code === "ER_LOCK_DEADLOCK") return send(res, 409, "Someone else was saving the same thing. Please try again.");
  console.error(`[request ${req.id}]`, err);
  return send(res, 500, "Something went wrong on the server");
}

export { notFound, errorHandler };
