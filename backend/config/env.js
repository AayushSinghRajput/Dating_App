// Fails fast with a clear message instead of crashing later with a cryptic
// "Cannot read property of undefined" once some unrelated request touches
// the missing config.
const REQUIRED_VARS = ["MONGO_URI", "JWT_SECRET"];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    console.error("Check backend/.env — see .env.example for the full list.");
    process.exit(1);
  }
}
