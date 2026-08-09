import crypto from "crypto";
import User from "../models/userModel.js";
import { PREMIUM_DURATION_DAYS, ESEWA_SECRET_KEY } from "../config/payment.js";

// Extends (stacks on top of any remaining time) the user's premium expiry.
export async function grantPremium(userId) {
  const user = await User.findById(userId);
  if (!user) return;
  const now = new Date();
  const base = user.premiumExpiresAt && user.premiumExpiresAt > now ? user.premiumExpiresAt : now;
  user.isPremium = true;
  user.premiumExpiresAt = new Date(base.getTime() + PREMIUM_DURATION_DAYS * 24 * 60 * 60 * 1000);
  await user.save();
}

export function esewaSignature(fields, fieldOrder) {
  const message = fieldOrder.map((f) => `${f}=${fields[f]}`).join(",");
  return crypto.createHmac("sha256", ESEWA_SECRET_KEY).update(message).digest("base64");
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
