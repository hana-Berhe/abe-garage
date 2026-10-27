const { badField } = require("../../shared/respond");
const v = require("../../shared/validate");

const BEST_TIMES = ["any", "morning", "afternoon"];
const PHONE_RE = /^[+\d][\d\s()-]{5,29}$/;

// The public "Request a call back" form. service_id is empty when the customer picked "Not sure".
function readCallback(body) {
  const fullName = v.requireText(body, "full_name", "Full name", 100);
  const phone = v.requireText(body, "phone", "Phone number", 30);
  if (!PHONE_RE.test(phone)) throw badField("phone", "Phone number is not valid");
  const serviceId = body.service_id === "" || body.service_id == null ? null : v.requireId(body.service_id, "service_id", "Service");
  const bestTime = body.best_time == null || body.best_time === "" ? "any" : body.best_time;
  if (!BEST_TIMES.includes(bestTime)) throw badField("best_time", "Best time to call is not valid");
  return {
    full_name: fullName,
    phone,
    car: v.optionalText(body, "car", "Your car", 120),
    service_id: serviceId,
    problem: v.optionalText(body, "problem", "What seems to be wrong", 1000),
    best_time: bestTime,
  };
}

module.exports = { readCallback, BEST_TIMES };
