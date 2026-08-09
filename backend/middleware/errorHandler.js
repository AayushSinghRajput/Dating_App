// Central error handler. Express 5 auto-forwards rejected promises from
// async route handlers here, so most controllers don't need their own
// catch-and-500 boilerplate anymore — only catches for expected, specific
// error responses (400/403/404 with a custom message) still make sense.
export function errorHandler(err, req, res, next) {
  console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, err);
  if (res.headersSent) return next(err);

  // Mongoose CastError — e.g. malformed ObjectId, or a NoSQL-injection
  // payload stripped down to a shape the schema can't cast.
  if (err.name === "CastError") {
    return res.status(400).json({ message: `Invalid value for field "${err.path}"` });
  }

  // Mongoose schema validation failures.
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(" ");
    return res.status(400).json({ message: message || "Validation failed" });
  }

  // Duplicate key (e.g. email/googleId/referralCode unique index conflict).
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "value";
    return res.status(409).json({ message: `That ${field} is already in use` });
  }

  const status = err.status || err.statusCode || 500;
  const exposedMessage =
    status < 500 || process.env.NODE_ENV !== "production"
      ? err.message
      : "Something went wrong";

  res.status(status).json({ message: exposedMessage || "Something went wrong" });
}
