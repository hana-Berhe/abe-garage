const { ApiError, send } = require("../shared/respond");

function notFound(req, res) {
  return send(res, 404, "Not found");
}

// One shared handler so no request hangs and every error is { status, message, data }.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) return send(res, err.httpStatus, err.message, err.data);
  if (err.type === "entity.parse.failed") return send(res, 400, "Request body is not valid JSON");
  if (err.code === "ER_DUP_ENTRY") return send(res, 409, "This record already exists");
  console.error(err);
  return send(res, 500, "Something went wrong on the server");
}

module.exports = { notFound, errorHandler };
