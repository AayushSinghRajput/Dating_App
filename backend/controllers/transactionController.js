import User from "../models/userModel.js";
import Transaction from "../models/transactionModel.js";

// @desc    Let the app confirm a transaction's final status (fallback if the
//          in-app browser closes before the deep-link redirect is caught)
// @route   GET /api/payments/status/:transactionUuid
// @access  Private
export const getTransactionStatus = async (req, res) => {
  const transaction = await Transaction.findOne({
    transactionUuid: req.params.transactionUuid,
    user: req.user.id,
  });
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });

  const user = await User.findById(req.user.id).select("isPremium premiumExpiresAt");

  res.status(200).json({
    status: transaction.status,
    isPremium: user?.isPremium || false,
    premiumExpiresAt: user?.premiumExpiresAt || null,
  });
};
