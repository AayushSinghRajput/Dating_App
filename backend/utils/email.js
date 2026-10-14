import { Resend } from "resend";
import nodemailer from "nodemailer";

let resendClient = null;
let nodemailerTransporter = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function getNodemailerTransporter() {
  if (!nodemailerTransporter && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    nodemailerTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return nodemailerTransporter;
}

/**
 * Sends a transactional email using Resend (primary) or Gmail SMTP (fallback).
 * If neither is configured in development, logs the email content to console.
 */
export async function sendEmail({ to, subject, text, html }) {
  const from = process.env.EMAIL_FROM || "Soulmate <onboarding@resend.dev>";
  const errors = [];

  const isResendSandbox = !from || from.includes("resend.dev");
  const hasGmail = Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
  const hasResend = Boolean(process.env.RESEND_API_KEY);

  const tryGmail = async () => {
    const transporter = getNodemailerTransporter();
    const info = await transporter.sendMail({
      from: `"Soulmate" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    return { provider: "gmail", id: info.messageId };
  };

  const tryResend = async () => {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });
    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }
    return { provider: "resend", id: data?.id };
  };

  // Determine provider priority:
  // If Gmail is configured and Resend is on the test domain (resend.dev),
  // Gmail is preferred because resend.dev only allows sending to the single registered Resend account.
  const providers = [];
  if (hasGmail && isResendSandbox) {
    providers.push({ name: "gmail", fn: tryGmail });
    if (hasResend) providers.push({ name: "resend", fn: tryResend });
  } else {
    if (hasResend) providers.push({ name: "resend", fn: tryResend });
    if (hasGmail) providers.push({ name: "gmail", fn: tryGmail });
  }

  for (const provider of providers) {
    try {
      const result = await provider.fn();
      console.log(`[Email] Successfully sent email to ${to} via ${provider.name} (id: ${result.id})`);
      return result;
    } catch (err) {
      console.warn(`[Email] ${provider.name} delivery attempt failed:`, err?.message || err);
      errors.push(`${provider.name}: ${err?.message || err}`);
    }
  }

  // Fallback: Development local mock simulator
  if (process.env.NODE_ENV !== "production") {
    console.warn("\n================ [DEV EMAIL SIMULATOR] ================");
    console.warn(`To: ${to}`);
    console.warn(`Subject: ${subject}`);
    console.warn(`Body: ${text}`);
    if (errors.length) {
      console.warn(`(Notice: Live email delivery failed: ${errors.join("; ")})`);
    }
    console.warn("========================================================\n");
    return { provider: "mock", id: "dev-mock-id" };
  }

  throw new Error(`Email delivery failed: ${errors.join("; ") || "No transactional email provider configured"}`);
}

export async function sendPasswordResetEmail(toEmail, code) {
  const subject = "Your password reset code";
  const text = `Your Soulmate password reset code is ${code}. It expires in 15 minutes. If you didn't request this, you can ignore this email.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e63946; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Soulmate</h1>
      </div>
      <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Reset your password</h2>
      <p style="color: #555555; font-size: 15px; line-height: 22px; margin: 0 0 20px 0;">
        Use the verification code below in the app to reset your account password. This code will expire in <strong>15 minutes</strong>.
      </p>
      <div style="background-color: #fdf2f4; border: 1px dashed #e63946; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #e63946; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #888888; font-size: 13px; line-height: 18px; margin: 20px 0 0 0; text-align: center;">
        If you didn't request a password reset, you can safely ignore this email. Your account remains secure.
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, text, html });
}

export async function sendEmailVerificationEmail(toEmail, code) {
  const subject = "Verify your email address";
  const text = `Your Soulmate email verification code is ${code}. It expires in 15 minutes.`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 460px; margin: 0 auto; padding: 24px; border: 1px solid #f0f0f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e63946; font-size: 26px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">Soulmate</h1>
      </div>
      <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin-bottom: 8px;">Verify your email</h2>
      <p style="color: #555555; font-size: 15px; line-height: 22px; margin: 0 0 20px 0;">
        Thank you for joining Soulmate! Please use the 6-digit verification code below to verify your email address. This code expires in <strong>15 minutes</strong>.
      </p>
      <div style="background-color: #fdf2f4; border: 1px dashed #e63946; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #e63946; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #888888; font-size: 13px; line-height: 18px; margin: 20px 0 0 0; text-align: center;">
        If you did not sign up for Soulmate, please disregard this email.
      </p>
    </div>
  `;

  return sendEmail({ to: toEmail, subject, text, html });
}
