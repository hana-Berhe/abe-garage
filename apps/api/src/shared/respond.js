// Every answer has the shape { status, message, data } (NFR-08).
class ApiError extends Error {
  constructor(httpStatus, message, data = null) {
    super(message);
    this.httpStatus = httpStatus;
    this.data = data;
  }
}

function send(res, httpStatus, message, data = null) {
  return res.status(httpStatus).json({
    status: httpStatus < 400 ? "success" : "error",
    message,
    data,
  });
}

const ok = (res, message, data) => send(res, 200, message, data);
const created = (res, message, data) => send(res, 201, message, data);

// 400 with the field name, so the form can show the message under that field (NFR-10).
// The error handler turns { field } into the task list's { errors: { field: message } }.
const badField = (field, message) => new ApiError(400, message, { field });

module.exports = { ApiError, send, ok, created, badField };
