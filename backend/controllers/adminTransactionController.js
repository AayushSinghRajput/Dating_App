import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List all payments with optional provider/status filtering and aggregate revenue
// @route   GET /api/admin/transactions?provider=&status=&page=
// @access  Private/Admin
export const listTransactions = async (req, res) => {
  const { provider, status, search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const filter = {};
  if (provider) filter.provider = provider;
  if (status) filter.status = status;

  if (search.trim()) {
    const matchingUsers = await User.find({
      $or: [
        { username: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ],
    }).select("_id");
    const userIds = matchingUsers.map((u) => u._id);

    filter.$or = [
      { transactionId: { $regex: search.trim(), $options: "i" } },
      { productId: { $regex: search.trim(), $options: "i" } },
      { user: { $in: userIds } },
    ];
  }

  const [transactions, total, revenueStats] = await Promise.all([
    Transaction.find(filter)
      .populate("user", "username email isPremium")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Transaction.countDocuments(filter),
    Transaction.aggregate([
      {
        $group: {
          _id: "$status",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  let totalCompletedRevenue = 0;
  let totalPendingAmount = 0;
  let completedCount = 0;

  revenueStats.forEach((stat) => {
    if (stat._id === "completed") {
      totalCompletedRevenue = stat.totalAmount;
      completedCount = stat.count;
    } else if (stat._id === "pending") {
      totalPendingAmount = stat.totalAmount;
    }
  });

  res.status(200).json({
    transactions,
    total,
    page: pageNum,
    pageSize,
    stats: {
      totalCompletedRevenue,
      completedCount,
      totalPendingAmount,
    },
  });
};

// @desc    Mark a transaction for refund or update refund status
// @route   PATCH /api/admin/transactions/:transactionId/refund
// @access  Private/Admin
export const updateRefundStatus = async (req, res) => {
  const { refundStatus, refundNote } = req.body;
  const validStatuses = ["requested", "approved", "rejected"];

  if (!validStatuses.includes(refundStatus)) {
    return res.status(400).json({ message: `refundStatus must be one of: ${validStatuses.join(", ")}` });
  }

  const transaction = await Transaction.findById(req.params.transactionId).populate("user", "username email");
  if (!transaction) return res.status(404).json({ message: "Transaction not found" });

  transaction.refundStatus = refundStatus;
  if (refundNote) transaction.refundNote = refundNote;
  if (refundStatus === "approved") transaction.refundedAt = new Date();

  await transaction.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_REFUND",
    targetId: transaction._id,
    targetType: "Transaction",
    details: { refundStatus, user: transaction.user?.username },
    req,
  });

  res.status(200).json({ message: "Refund status updated", transaction });
};
