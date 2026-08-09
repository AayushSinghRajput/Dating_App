import crypto from "crypto";
import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";
import {
  PREMIUM_PLAN_PRICE_NPR,
  KHALTI_SECRET_KEY,
  KHALTI_BASE_URL,
  BACKEND_PUBLIC_URL,
  APP_DEEP_LINK_SCHEME,
} from "../config/payment.js";
import { grantPremium } from "../utils/paymentHelpers.js";

const APP_REDIRECT_URL = `${APP_DEEP_LINK_SCHEME}://payment-result`;

// @desc    Start a Khalti payment for the Premium plan
// @route   POST /api/payments/khalti/initiate
// @access  Private
export const initiateKhaltiPayment = async (req, res) => {
  if (!KHALTI_SECRET_KEY) {
    return res.status(500).json({ message: "Khalti is not configured on this server yet" });
  }

  const user = await User.findById(req.user.id).select("username email");
  const transactionUuid = crypto.randomUUID();
  await Transaction.create({
    user: req.user.id,
    provider: "khalti",
    plan: "premium_monthly",
    amount: PREMIUM_PLAN_PRICE_NPR,
    transactionUuid,
  });

  const khaltiRes = await fetch(`${KHALTI_BASE_URL}/epayment/initiate/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${KHALTI_SECRET_KEY}`,
    },
    body: JSON.stringify({
      return_url: `${BACKEND_PUBLIC_URL}/api/payments/khalti/callback`,
      website_url: BACKEND_PUBLIC_URL,
      amount: PREMIUM_PLAN_PRICE_NPR * 100, // Khalti expects paisa
      purchase_order_id: transactionUuid,
      purchase_order_name: "Soulmate Premium (Monthly)",
      customer_info: { name: user?.username || "Soulmate user", email: user?.email },
    }),
  });

  const khaltiData = await khaltiRes.json();
  if (!khaltiRes.ok || !khaltiData.payment_url) {
    console.error("Khalti initiate failed:", khaltiData);
    await Transaction.findOneAndUpdate({ transactionUuid }, { status: "failed" });
    return res.status(502).json({ message: "Failed to start Khalti payment" });
  }

  await Transaction.findOneAndUpdate({ transactionUuid }, { providerRef: khaltiData.pidx });

  res.status(200).json({ paymentUrl: khaltiData.payment_url });
};

// @desc    Khalti's return_url — the user's browser is redirected here after payment
// @route   GET /api/payments/khalti/callback
// @access  Public (called by the user's browser, not by Khalti's servers)
export const khaltiCallback = async (req, res) => {
  try {
    const { pidx, purchase_order_id } = req.query;
    if (!pidx) return res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=khalti`);

    const lookupRes = await fetch(`${KHALTI_BASE_URL}/epayment/lookup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${KHALTI_SECRET_KEY}`,
      },
      body: JSON.stringify({ pidx }),
    });
    const lookupData = await lookupRes.json();

    if (lookupData.status !== "Completed") {
      await Transaction.findOneAndUpdate({ transactionUuid: purchase_order_id }, { status: "failed" });
      return res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=khalti`);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionUuid: purchase_order_id, status: "pending" },
      { status: "completed", providerRef: pidx },
      { new: true }
    );

    if (transaction) {
      await grantPremium(transaction.user);
    }

    res.redirect(`${APP_REDIRECT_URL}?status=success&provider=khalti`);
  } catch (error) {
    console.error("Error handling Khalti callback:", error);
    res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=khalti`);
  }
};
