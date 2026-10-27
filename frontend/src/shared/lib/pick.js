// Only the named keys of a loaded record. The server refuses fields an address doesn't read (BE-003),
// so forms built from a whole record send just the editable part.
export function pick(record, keys) {
  return Object.fromEntries(keys.filter((k) => record[k] !== undefined).map((k) => [k, record[k]]));
}
