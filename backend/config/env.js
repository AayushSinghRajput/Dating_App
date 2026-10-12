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

  // Guard against insecure default or weak JWT_SECRET in production
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.JWT_SECRET || "";
    const weakDefaults = ["mysecretkey123", "secret", "jwtsecret", "password"];
    if (secret.length < 32 || weakDefaults.includes(secret.toLowerCase())) {
      console.error(
        "FATAL: Insecure JWT_SECRET detected in production! JWT_SECRET must be a cryptographically random string of at least 32 characters. Run 'npm run generate-secret' to generate one."
      );
      process.exit(1);
    }
  }
}
