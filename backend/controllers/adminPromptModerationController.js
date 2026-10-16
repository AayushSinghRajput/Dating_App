import PromptModeration from "../models/promptModerationModel.js";
import Profile from "../models/profileModel.js";
import User from "../models/userModel.js";
import { logAdminAction } from "../utils/auditLogger.js";
import { sendNotification } from "../utils/notify.js";

// @desc    List prompt flags and voice notes in review queue
// @route   GET /api/admin/prompts-moderation
// @access  Private/Admin
export const listPromptModeration = async (req, res) => {
  try {
    const { status = "pending", type = "all", page = "1", limit = "20", search = "" } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);

    const filter = {};
    if (status !== "all") {
      filter.status = status;
    }
    if (type !== "all") {
      filter.type = type;
    }

    if (search.trim()) {
      filter.$or = [
        { promptQuestion: { $regex: search.trim(), $options: "i" } },
        { promptAnswer: { $regex: search.trim(), $options: "i" } },
        { flagReason: { $regex: search.trim(), $options: "i" } },
        { transcript: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      PromptModeration.find(filter)
        .populate("user", "username email banned trustScore isShadowbanned")
        .populate("profile", "name profileImage photos age gender")
        .populate("reviewedBy", "username")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      PromptModeration.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      total,
      page: pageNum,
      pageSize,
    });
  } catch (error) {
    console.error("Error listing prompt moderation items:", error);
    res.status(500).json({ message: "Server error listing prompt moderation queue" });
  }
};

// @desc    Resolve a prompt flag (approve, remove prompt, or warn user)
// @route   POST /api/admin/prompts-moderation/:id/action
// @access  Private/Admin
export const resolvePromptModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason = "", adminNotes = "" } = req.body;

    if (!["approve", "remove", "warn"].includes(action)) {
      return res.status(400).json({ message: "Action must be 'approve', 'remove', or 'warn'" });
    }

    const flag = await PromptModeration.findById(id).populate("user", "username email trustScore");
    if (!flag) {
      return res.status(404).json({ message: "Prompt moderation item not found" });
    }

    const targetUserId = flag.user?._id;

    if (action === "approve") {
      flag.status = "approved";
      flag.reviewedBy = req.user._id;
      flag.reviewedAt = new Date();
      flag.adminNotes = adminNotes;
      await flag.save();
    } else if (action === "remove" || action === "warn") {
      flag.status = "removed";
      flag.reviewedBy = req.user._id;
      flag.reviewedAt = new Date();
      flag.adminNotes = adminNotes || reason;
      await flag.save();

      // Remove the offensive prompt from the user's active Profile
      if (targetUserId) {
        await Profile.updateOne(
          { user: targetUserId },
          {
            $pull: {
              prompts: { question: flag.promptQuestion },
            },
          }
        );

        // Adjust trust score down
        const penalty = action === "warn" ? 15 : 8;
        await User.findByIdAndUpdate(targetUserId, {
          $inc: { trustScore: -penalty },
        });

        // Send warning notification via Socket.io if available
        const io = req.app.get("io");
        if (io) {
          sendNotification(io, targetUserId.toString(), {
            title: action === "warn" ? "Warning: Community Guidelines Violation" : "Profile Prompt Removed",
            message:
              reason ||
              `Your prompt "${flag.promptQuestion}" was removed as it violated our community guidelines.`,
            type: "system",
          });
        }
      }
    }

    await logAdminAction({
      adminId: req.user._id,
      action: `PROMPT_${action.toUpperCase()}`,
      targetId: flag._id,
      targetType: "PromptModeration",
      details: {
        userId: targetUserId,
        promptQuestion: flag.promptQuestion,
        action,
        reason,
        adminNotes,
      },
      req,
    });

    res.status(200).json({
      message: `Prompt moderation resolved: ${action}`,
      flag,
    });
  } catch (error) {
    console.error("Error resolving prompt moderation:", error);
    res.status(500).json({ message: "Server error resolving prompt moderation" });
  }
};

// @desc    Get counts and metrics for prompt moderation desk
// @route   GET /api/admin/prompts-moderation/stats
// @access  Private/Admin
export const getPromptModerationStats = async (req, res) => {
  try {
    const [pendingVoice, pendingText, totalRemovedToday] = await Promise.all([
      PromptModeration.countDocuments({ status: "pending", type: "voice_prompt" }),
      PromptModeration.countDocuments({ status: "pending", type: "text_prompt" }),
      PromptModeration.countDocuments({
        status: "removed",
        reviewedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
    ]);

    res.status(200).json({
      pendingVoice,
      pendingText,
      pendingTotal: pendingVoice + pendingText,
      totalRemovedToday,
    });
  } catch (error) {
    console.error("Error getting prompt moderation stats:", error);
    res.status(500).json({ message: "Server error getting prompt moderation stats" });
  }
};
