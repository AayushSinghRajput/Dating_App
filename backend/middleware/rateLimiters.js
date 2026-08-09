import rateLimit from "express-rate-limit";

// Generous default — mainly a backstop against runaway clients/scripts.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

// Tighter limit for auth endpoints (login, register, password reset, Google
// sign-in) — these are the classic brute-force / credential-stuffing targets.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});
