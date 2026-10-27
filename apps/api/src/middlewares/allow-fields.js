const { ApiError } = require("../shared/respond");

// BE-003: each address lists the body fields it reads. Anything else is refused with 400, so a typo or a
// field the address would ignore never passes silently.
//   nested:  { vehicle: [...] } checks the keys of an object field; for an array field, the keys of each item.
//   refused: { password: "..." } gives a clearer message than "Unknown field" for a field that is known to be wrong here.
function allowFields(fields, { nested = {}, refused = {} } = {}) {
  const allowed = new Set([...fields, ...Object.keys(nested)]);
  return (req, res, next) => {
    const body = req.body === undefined ? {} : req.body;
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return next(new ApiError(400, "Request body must be a JSON object"));
    }
    const errors = {};
    for (const key of Object.keys(body)) {
      if (!allowed.has(key)) errors[key] = refused[key] || "Unknown field";
    }
    for (const [key, keys] of Object.entries(nested)) {
      const value = body[key];
      const items = Array.isArray(value) ? value.map((item, i) => [`${key}.${i}`, item]) : [[key, value]];
      for (const [path, item] of items) {
        if (!item || typeof item !== "object" || Array.isArray(item)) continue; // the validator reports the wrong type
        for (const k of Object.keys(item)) if (!keys.includes(k)) errors[`${path}.${k}`] = "Unknown field";
      }
    }
    if (Object.keys(errors).length) return next(new ApiError(400, "Validation failed", { errors }));
    return next();
  };
}

module.exports = { allowFields };
