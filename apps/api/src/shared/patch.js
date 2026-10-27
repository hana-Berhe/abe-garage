const { badField } = require("./respond");

// PATCH edits: fields left out keep their saved value, so the existing validators see a whole record.
// At least one editable field must be sent.
function mergePatch(current, body, fields) {
  if (!fields.some((f) => body[f] !== undefined)) {
    throw badField(fields[0], `Nothing to change. Send at least one of: ${fields.join(", ")}`);
  }
  return Object.fromEntries(fields.map((f) => [f, body[f] !== undefined ? body[f] : current[f]]));
}

module.exports = { mergePatch };
