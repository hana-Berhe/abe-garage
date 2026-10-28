// PATCH edits: fields left out keep their saved value, so the service always gets a whole record.
// The route's rules have already checked the fields that were sent, and that at least one was (somethingToChange).
function mergePatch(current, body, fields) {
  return Object.fromEntries(fields.map((f) => [f, body[f] !== undefined ? body[f] : current[f]]));
}

export { mergePatch };
