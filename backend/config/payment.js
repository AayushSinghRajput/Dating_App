export const PREMIUM_PLAN_PRICE_NPR = Number(process.env.PREMIUM_PLAN_PRICE_NPR) || 500;
export const PREMIUM_DURATION_DAYS = 30;

// eSewa's publicly-documented UAT (sandbox) test merchant credentials — safe
// defaults so integration works out of the box before real merchant
// credentials are configured. Override with real values in production.
export const ESEWA_MERCHANT_CODE = process.env.ESEWA_MERCHANT_CODE || "EPAYTEST";
export const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
export const ESEWA_GATEWAY_URL =
  process.env.ESEWA_GATEWAY_URL || "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
export const ESEWA_STATUS_CHECK_URL =
  process.env.ESEWA_STATUS_CHECK_URL || "https://rc.esewa.com.np/api/epay/transaction/status/";

// Khalti has no public test key — a real secret key from the merchant
// dashboard (sandbox or live) must be set via env before this works.
export const KHALTI_SECRET_KEY = process.env.KHALTI_SECRET_KEY || "";
export const KHALTI_BASE_URL = process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2";

// Must be reachable by the paying user's phone browser (LAN IP is fine for
// local dev, since eSewa/Khalti redirect the user's own browser back here —
// their servers never call this URL directly).
export const BACKEND_PUBLIC_URL = process.env.BACKEND_PUBLIC_URL || "http://localhost:5000";

// Matches the "scheme" in frontend/app.json — used to redirect the user's
// in-app browser back into the app once payment is verified.
export const APP_DEEP_LINK_SCHEME = process.env.APP_DEEP_LINK_SCHEME || "datingapp";
