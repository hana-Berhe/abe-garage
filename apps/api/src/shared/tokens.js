const jwt = require("jsonwebtoken");

// BE-004: a login token is signed with HS256, names this API as its issuer and the website as its audience,
// says it is an access token, and lasts JWT_EXPIRES_IN_SECONDS (1 hour by default).
// role_id and name are only there for the website's menus; the server reads the role from the database (BE-003).
const ALGORITHM = "HS256";
const options = () => ({
  issuer: process.env.JWT_ISSUER || "abe-garage-api",
  audience: process.env.JWT_AUDIENCE || "abe-garage-web",
});

function lifetimeSeconds() {
  const seconds = Number(process.env.JWT_EXPIRES_IN_SECONDS);
  return Number.isInteger(seconds) && seconds > 0 ? seconds : 3600;
}

function signAccessToken(employee) {
  const expiresIn = lifetimeSeconds();
  const accessToken = jwt.sign(
    {
      employee_id: employee.employee_id,
      token_version: employee.token_version,
      token_use: "access",
      role_id: employee.role_id,
      name: `${employee.first_name} ${employee.last_name}`,
    },
    process.env.JWT_SECRET,
    { algorithm: ALGORITHM, expiresIn, ...options() }
  );
  return { access_token: accessToken, token_type: "Bearer", expires_in: expiresIn };
}

// Throws when the signature, algorithm, issuer, audience, expiry or token_use is wrong.
function verifyAccessToken(token) {
  const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: [ALGORITHM], ...options() });
  if (payload.token_use !== "access") throw new Error("Not an access token");
  return payload;
}

// "Authorization: Bearer <token>"; the older x-access-token header still works.
function readToken(req) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || "");
  return match ? match[1] : req.headers["x-access-token"];
}

module.exports = { signAccessToken, verifyAccessToken, readToken };
