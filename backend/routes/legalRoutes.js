import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import User from "../models/userModel.js";
import { sendEmail } from "../utils/email.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "../public");

const router = express.Router();

// Public web pages
router.get("/privacy", (req, res) => {
  res.sendFile(path.join(publicDir, "privacy.html"));
});

router.get("/terms", (req, res) => {
  res.sendFile(path.join(publicDir, "terms.html"));
});

router.get("/eula", (req, res) => {
  res.redirect("/terms#eula");
});

router.get("/community-guidelines", (req, res) => {
  res.sendFile(path.join(publicDir, "community-guidelines.html"));
});

router.get("/delete-account", (req, res) => {
  res.sendFile(path.join(publicDir, "delete-account.html"));
});

// Google Play / App Store public data deletion request handler
router.post("/api/legal/request-deletion", async (req, res) => {
  try {
    const { email, reason, details } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({ message: "Please provide a valid email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (user) {
      console.log(
        `[Account Deletion Request] Web request received for user ${user._id} (${normalizedEmail}). Reason: ${reason || "none"}`
      );

      try {
        await sendEmail({
          to: normalizedEmail,
          subject: "Soulmate — Account & Data Deletion Request Received",
          text: `Hello ${user.username},\n\nWe have received your request to permanently delete your Soulmate account and associated personal data.\n\nIf you submitted this request, our safety team will process your account erasure within 24 to 48 hours.\n\nIf you did not make this request, please log in to your account immediately to secure your credentials.\n\nThank you,\nSoulmate Team`,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1f2937; line-height: 1.6;">
            <div style="background: #e63946; padding: 12px 20px; border-radius: 8px; color: #fff; font-weight: 700; font-size: 18px; margin-bottom: 20px;">
              Soulmate Safety Team
            </div>
            <h2 style="color: #111827; font-size: 20px; margin-bottom: 12px;">Account & Data Deletion Request</h2>
            <p>Hello <strong>${user.username}</strong>,</p>
            <p>We have received your web request to permanently delete your Soulmate account and all associated personal data (profile, photos, chat history, and matches).</p>
            <p style="background: #f3f4f6; padding: 12px 16px; border-radius: 6px; font-size: 14px; color: #4b5563;">
              <strong>Retention & Deletion Timeline:</strong> In compliance with Google Play and Apple App Store data policies, verified requests are processed within <strong>24 to 48 hours</strong>.
            </p>
            <p style="font-size: 13px; color: #6b7280; margin-top: 16px;">
              If you did not initiate this request, please sign in to your Soulmate account immediately to secure your credentials or reply to this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Soulmate Dating App • com.aayushsinghrajput.Datingapp
            </p>
          </div>`,
        });
      } catch (emailErr) {
        console.error(
          "[Account Deletion Request] Failed to send email confirmation:",
          emailErr.message
        );
      }
    } else {
      console.log(
        `[Account Deletion Request] Web request received for non-existent email: ${normalizedEmail}`
      );
    }

    // Always respond with a generic success message to prevent user enumeration attacks
    res.status(200).json({
      message:
        "Your request has been received. If an account is associated with this email, a confirmation has been sent and your data will be queued for permanent deletion.",
    });
  } catch (err) {
    console.error("[Account Deletion Request] Error processing request:", err);
    res.status(500).json({
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
});

export default router;
