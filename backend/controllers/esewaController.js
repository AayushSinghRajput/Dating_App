import crypto from "crypto";
import Transaction from "../models/transactionModel.js";
import {
  PREMIUM_PLAN_PRICE_NPR,
  ESEWA_MERCHANT_CODE,
  ESEWA_GATEWAY_URL,
  ESEWA_STATUS_CHECK_URL,
  BACKEND_PUBLIC_URL,
  APP_DEEP_LINK_SCHEME,
} from "../config/payment.js";
import { grantPremium, esewaSignature, escapeHtml } from "../utils/paymentHelpers.js";

const APP_REDIRECT_URL = `${APP_DEEP_LINK_SCHEME}://payment-result`;

// @desc    Start an eSewa payment for the Premium plan
// @route   POST /api/payments/esewa/initiate
// @access  Private
export const initiateEsewaPayment = async (req, res) => {
  const transactionUuid = crypto.randomUUID();
  await Transaction.create({
    user: req.user.id,
    provider: "esewa",
    plan: "premium_monthly",
    amount: PREMIUM_PLAN_PRICE_NPR,
    transactionUuid,
  });

  res.status(200).json({
    formUrl: `${BACKEND_PUBLIC_URL}/api/payments/esewa/form/${transactionUuid}`,
  });
};

// @desc    Serves an auto-submitting HTML form that hands the user off to eSewa.
//          Opened directly in the user's in-app browser (not an API/JSON call).
// @route   GET /api/payments/esewa/form/:transactionUuid
// @access  Public (the transactionUuid itself is the capability token)
export const getEsewaForm = async (req, res) => {
  try {
    const { transactionUuid } = req.params;
    const transaction = await Transaction.findOne({ transactionUuid, provider: "esewa" });
    if (!transaction || transaction.status !== "pending") {
      return res.status(404).send("<h3>Payment session not found or already used.</h3>");
    }

    const totalAmount = String(transaction.amount);
    const fields = {
      amount: totalAmount,
      tax_amount: "0",
      total_amount: totalAmount,
      transaction_uuid: transactionUuid,
      product_code: ESEWA_MERCHANT_CODE,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: `${BACKEND_PUBLIC_URL}/api/payments/esewa/callback`,
      failure_url: `${BACKEND_PUBLIC_URL}/api/payments/esewa/failure`,
      signed_field_names: "total_amount,transaction_uuid,product_code",
    };
    fields.signature = esewaSignature(fields, ["total_amount", "transaction_uuid", "product_code"]);

    const inputs = Object.entries(fields)
      .map(([key, value]) => `<input type="hidden" name="${key}" value="${escapeHtml(value)}" />`)
      .join("\n");

    res.status(200).send(`<!DOCTYPE html>
<html><body onload="document.forms[0].submit()">
  <p>Redirecting to eSewa...</p>
  <form method="POST" action="${ESEWA_GATEWAY_URL}">${inputs}</form>
</body></html>`);
  } catch (error) {
    console.error("Error serving eSewa form:", error);
    res.status(500).send("<h3>Something went wrong starting your payment.</h3>");
  }
};

// @desc    eSewa's success_url — the user's browser is redirected here after payment
// @route   GET /api/payments/esewa/callback
// @access  Public (called by the user's browser, not by eSewa's servers)
export const esewaCallback = async (req, res) => {
  try {
    const raw = req.query.data;
    if (!raw) return res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=esewa`);

    const data = JSON.parse(Buffer.from(String(raw), "base64").toString("utf-8"));
    const fieldOrder = String(data.signed_field_names || "").split(",");
    const expectedSignature = esewaSignature(data, fieldOrder);

    if (expectedSignature !== data.signature || data.status !== "COMPLETE") {
      await Transaction.findOneAndUpdate({ transactionUuid: data.transaction_uuid }, { status: "failed" });
      return res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=esewa`);
    }

    // Double-check directly with eSewa before granting anything.
    const statusUrl = `${ESEWA_STATUS_CHECK_URL}?product_code=${encodeURIComponent(data.product_code)}&total_amount=${encodeURIComponent(data.total_amount)}&transaction_uuid=${encodeURIComponent(data.transaction_uuid)}`;
    const statusRes = await fetch(statusUrl);
    const statusData = await statusRes.json();

    if (statusData.status !== "COMPLETE") {
      await Transaction.findOneAndUpdate({ transactionUuid: data.transaction_uuid }, { status: "failed" });
      return res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=esewa`);
    }

    const transaction = await Transaction.findOneAndUpdate(
      { transactionUuid: data.transaction_uuid, status: "pending" },
      { status: "completed", providerRef: data.transaction_code },
      { new: true }
    );

    if (transaction) {
      await grantPremium(transaction.user);
    }

    res.redirect(`${APP_REDIRECT_URL}?status=success&provider=esewa`);
  } catch (error) {
    console.error("Error handling eSewa callback:", error);
    res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=esewa`);
  }
};

// @desc    eSewa's failure_url — user cancelled or payment failed
// @route   GET /api/payments/esewa/failure
// @access  Public
export const esewaFailure = async (req, res) => {
  res.redirect(`${APP_REDIRECT_URL}?status=failed&provider=esewa`);
};
