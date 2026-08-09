import User from "../models/userModel.js";
import { generateToken } from "../utils/generate_token.js";
import { generateUniqueReferralCode, applyReferralReward } from "../utils/referral.js";

// @desc    Register user
// @route   POST /api/auth/register
export const registerUser = async (req, res) => {
  const { username, email, password, acceptedTerms, referralCode } = req.body;

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" });

  if (!acceptedTerms)
    return res.status(400).json({
      message: "You must confirm you are 18+ and accept the Terms of Service.",
    });

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  let referrer = null;
  if (referralCode) {
    referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
  }

  const user = await User.create({
    username,
    email,
    password,
    termsAcceptedAt: new Date(),
    referralCode: await generateUniqueReferralCode(),
    referredBy: referrer?._id,
  });

  if (referrer) {
    await applyReferralReward(referrer._id);
  }

  res.status(201).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id),
  });
};

// @desc    Login user
// @route   POST /api/auth/login
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user && !user.password) {
    return res.status(401).json({
      message: "This account signs in with Google. Please use 'Continue with Google'.",
    });
  }
  if (user && (await user.matchPassword(password))) {
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
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
  if (!idToken) return res.status(400).json({ message: "idToken is required" });

  const verifyRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!verifyRes.ok) {
    return res.status(401).json({ message: "Invalid Google token" });
  }
  const payload = await verifyRes.json();

  if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
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
    });
  } else if (!user.googleId) {
    // Existing email/password account signing in with Google for the first time — link it.
    user.googleId = payload.sub;
    await user.save();
  }

  res.status(200).json({
    _id: user._id,
    username: user.username,
    email: user.email,
    token: generateToken(user._id),
  });
};
