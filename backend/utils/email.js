import nodemailer from "nodemailer";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail(toEmail, code) {
  await getTransporter().sendMail({
    from: `"Soulmate" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Your password reset code",
    text: `Your Soulmate password reset code is ${code}. It expires in 15 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color:#e63946;">Reset your password</h2>
        <p>Use this code in the app to reset your password. It expires in 15 minutes.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; margin: 24px 0;">${code}</p>
        <p style="color:#777; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail(toEmail, code) {
  await getTransporter().sendMail({
    from: `"Soulmate" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: "Verify your email",
    text: `Your Soulmate email verification code is ${code}. It expires in 15 minutes.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
        <h2 style="color:#e63946;">Verify your email</h2>
        <p>Use this code in the app to verify your email address. It expires in 15 minutes.</p>
        <p style="font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; margin: 24px 0;">${code}</p>
        <p style="color:#777; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
