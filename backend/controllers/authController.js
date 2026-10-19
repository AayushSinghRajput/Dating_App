import User from "../models/userModel.js";
import { generateToken } from "../utils/generate_token.js";
import { generateUniqueReferralCode, applyReferralReward } from "../utils/referral.js";
import { checkDeviceBlacklist } from "../utils/deviceCheck.js";

function getClientDeviceInfo(req) {
  const deviceId = (req.headers["x-device-id"] || req.body?.deviceId || "").toString().trim();
  const hardwareFingerprint = (req.headers["x-hardware-fingerprint"] || req.body?.hardwareFingerprint || "").toString().trim();
  const ip = (req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "").trim();
  return { deviceId, hardwareFingerprint, ip };
}

// @desc    Register user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  const { username, email, password, acceptedTerms, referralCode } = req.body;
  const { deviceId, hardwareFingerprint, ip } = getClientDeviceInfo(req);

  // Check if device or IP is blacklisted
  const blacklisted = await checkDeviceBlacklist(req);
  if (blacklisted) {
    return res.status(403).json({
      message: `Access denied. This device has been suspended (${blacklisted.reason || "Policy violation"}).`,
      banned: true,
    });
  }

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  if (!acceptedTerms)
    return res.status(400).json({
      message: "You must confirm you are 18+ and accept the Terms of Service.",
    });

  const normalizedEmail = email.trim().toLowerCase();
  const userExists = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
  }

  const user = await User.create({
    username,
    email: normalizedEmail,
    password,
    termsAcceptedAt: new Date(),
    referralCode: await generateUniqueReferralCode(),
    referredBy: referrer?._id,
    deviceId: deviceId || undefined,
    hardwareFingerprint: hardwareFingerprint || undefined,
    lastIp: ip || undefined,
  });

  if (referrer) {
    await applyReferralReward(referrer._id);
  }

  res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: Boolean(user.isAdmin),
    token: generateToken(user._id),
  });
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const { deviceId, hardwareFingerprint, ip } = getClientDeviceInfo(req);

  // Check if device or IP is blacklisted
  const blacklisted = await checkDeviceBlacklist(req);
  if (blacklisted) {
    return res.status(403).json({
      message: `Access denied. This device has been suspended (${blacklisted.reason || "Policy violation"}).`,
      banned: true,
    });
  }

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, "i") } });
  if (user && !user.password) {
    return res.status(401).json({
      message: "This account signs in with Google. Please use 'Continue with Google'.",
    });
  }
  if (user && (await user.matchPassword(password))) {
    if (user.banned) {
      return res.status(403).json({ message: "Your account has been suspended.", banned: true });
    }
    if (user.frozen) {
      return res.status(403).json({
        message: user.frozenReason || "Your account has been temporarily frozen by an administrator.",
        frozen: true,
      });
    }

    // Update user device and IP records
    if (deviceId && user.deviceId !== deviceId) user.deviceId = deviceId;
    if (hardwareFingerprint && user.hardwareFingerprint !== hardwareFingerprint) user.hardwareFingerprint = hardwareFingerprint;
    if (ip && user.lastIp !== ip) user.lastIp = ip;
    await user.save();

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: Boolean(user.isAdmin),
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        isAdmin: Boolean(user.isAdmin),
      },
      token: generateToken(user._id),
    });
  }
  res.status(401).json({ message: "Invalid email or password" });
};

// @desc    Sign in (or sign up) with a Google ID token obtained on the client
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res) => {
  const { idToken, acceptedTerms } = req.body;
  const { deviceId, hardwareFingerprint, ip } = getClientDeviceInfo(req);

  // Check if device or IP is blacklisted
  const blacklisted = await checkDeviceBlacklist(req);
  if (blacklisted) {
    return res.status(403).json({
      message: `Access denied. This device has been suspended (${blacklisted.reason || "Policy violation"}).`,
      banned: true,
    });
  }

  if (!idToken) return res.status(400).json({ message: "idToken is required" });

  const verifyRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!verifyRes.ok) {
    return res.status(401).json({ message: "Invalid Google token" });
  }
  const payload = await verifyRes.json();

  const allowedAudiences = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.ANDROID_GOOGLE_CLIENT_ID,
  ]
    .flatMap((id) => (id ? id.split(",").map((s) => s.trim()) : []))
    .filter(Boolean);

  if (allowedAudiences.length > 0 && !allowedAudiences.includes(payload.aud)) {
    return res.status(401).json({ message: "Invalid Google token audience" });
  }
  if (!payload.email) {
    return res.status(400).json({ message: "This Google account has no email" });
  }

  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

  if (!user) {
    if (!acceptedTerms) {
      return res.status(403).json({
        message: "Please create an account and accept the Terms of Service first.",
        requiresSignup: true,
      });
    }
    user = await User.create({
      username: payload.name || payload.email.split("@")[0],
      email: payload.email,
      googleId: payload.sub,
      authProvider: "google",
      termsAcceptedAt: new Date(),
      referralCode: await generateUniqueReferralCode(),
      emailVerified: payload.email_verified === "true" || payload.email_verified === true,
      deviceId: deviceId || undefined,
      hardwareFingerprint: hardwareFingerprint || undefined,
      lastIp: ip || undefined,
    });
  } else {
    if (user.banned) {
      return res.status(403).json({ message: "Your account has been suspended.", banned: true });
    }
    if (user.frozen) {
      return res.status(403).json({
        message: user.frozenReason || "Your account has been temporarily frozen by an administrator.",
        frozen: true,
      });
    }
    if (!user.googleId) {
      user.googleId = payload.sub;
    }
    if (deviceId && user.deviceId !== deviceId) user.deviceId = deviceId;
    if (hardwareFingerprint && user.hardwareFingerprint !== hardwareFingerprint) user.hardwareFingerprint = hardwareFingerprint;
    if (ip && user.lastIp !== ip) user.lastIp = ip;
    await user.save();
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id),
  });
};
