import { badField } from "./respond.js";

// NFR-16: edits send the updated_at they loaded.
function readUpdatedAt(body) {
  if (!body.updated_at || Number.isNaN(Date.parse(body.updated_at))) {
    throw badField("updated_at", "updated_at from the loaded record is required");
  }
  return new Date(body.updated_at);
}

export { readUpdatedAt };
