// Strips NoSQL-injection-prone keys (starting with "$", or containing ".")
// from the request body — e.g. { email: { $ne: null } } used to bypass a
// findOne({ email }) auth check. Deliberately only touches req.body: in
// Express 5, req.query is a read-only getter with no setter, so packages
// like express-mongo-sanitize that reassign it throw at request time.
function stripDangerousKeys(value) {
  if (Array.isArray(value)) {
    return value.map(stripDangerousKeys);
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      clean[key] = stripDangerousKeys(val);
    }
    return clean;
  }
  return value;
}

export function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = stripDangerousKeys(req.body);
  }
  next();
}
