const { ApiError } = require("./respond");

// Turns a MySQL duplicate-key error into 409 with the field name.
// keys maps a unique index name to [field, message].
function duplicateError(err, keys) {
  if (err.code !== "ER_DUP_ENTRY") return err;
  for (const [index, [field, message]] of Object.entries(keys)) {
    if (err.message.includes(index)) return new ApiError(409, message, { field });
  }
  return new ApiError(409, "This record already exists");
}

module.exports = { duplicateError };
