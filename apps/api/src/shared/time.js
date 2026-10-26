// "Today", "this week" and "this month" in the garage's time zone (NFR-17), as UTC instants for SQL.
const ZONE = () => process.env.APP_TIMEZONE || "UTC";

function zoneParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
    hourCycle: "h23", weekday: "short",
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return { y: +get("year"), m: +get("month"), d: +get("day"), h: +get("hour"), min: +get("minute"), s: +get("second"), weekday: get("weekday") };
}

// The UTC instant of local midnight on the given local date.
function localMidnight(y, m, d, timeZone) {
  const guess = Date.UTC(y, m - 1, d);
  const p = zoneParts(new Date(guess), timeZone);
  const offset = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - guess;
  return new Date(guess - offset);
}

function periodStarts(now = new Date(), timeZone = ZONE()) {
  const p = zoneParts(now, timeZone);
  const today = localMidnight(p.y, p.m, p.d, timeZone);
  // Weeks start on Monday.
  const back = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(p.weekday);
  const w = new Date(Date.UTC(p.y, p.m - 1, p.d - back));
  const week = localMidnight(w.getUTCFullYear(), w.getUTCMonth() + 1, w.getUTCDate(), timeZone);
  const month = localMidnight(p.y, p.m, 1, timeZone);
  return { today, week, month };
}

module.exports = { periodStarts };
