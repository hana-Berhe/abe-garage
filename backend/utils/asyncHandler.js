// Lets controllers be async and still reach the shared error handler.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
