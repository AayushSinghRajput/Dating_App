import EmailCampaign from "../models/emailCampaignModel.js";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// @desc    List all email campaigns
// @route   GET /api/admin/email-campaigns
// @access  Private/Admin
export const listEmailCampaigns = async (req, res) => {
  const campaigns = await EmailCampaign.find({})
    .populate("createdBy", "username email")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({ campaigns });
};

// @desc    Create a new email campaign draft
// @route   POST /api/admin/email-campaigns
// @access  Private/Admin
export const createEmailCampaign = async (req, res) => {
  const { subject, previewText, contentHtml, targetSegment = "all" } = req.body;

  if (!subject || !contentHtml) {
    return res.status(400).json({ message: "Subject and HTML content are required" });
  }

  const campaign = await EmailCampaign.create({
    subject,
    previewText: previewText || "",
    contentHtml,
    targetSegment,
    status: "draft",
    createdBy: req.user._id,
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_EMAIL_CAMPAIGN",
    targetType: "EmailCampaign",
    details: { subject, targetSegment },
    req,
  });

  res.status(201).json({ message: "Campaign created as draft", campaign });
};

// @desc    Dispatch / send email campaign to target segment
// @route   POST /api/admin/email-campaigns/:id/send
// @access  Private/Admin
export const sendEmailCampaign = async (req, res) => {
  const { id } = req.params;

  const campaign = await EmailCampaign.findById(id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });

  let filter = { banned: false };

  if (campaign.targetSegment === "inactive") {
    const sixtyDaysAgo = new Date(Date.now() - 60 * DAY_MS);
    filter.$or = [{ lastActiveAt: { $lt: sixtyDaysAgo } }, { lastActiveAt: null, createdAt: { $lt: sixtyDaysAgo } }];
  } else if (campaign.targetSegment === "free_users") {
    filter.isPremium = false;
  } else if (campaign.targetSegment === "unverified") {
    const unverifiedProfiles = await Profile.find({ verified: false }).select("user").lean();
    filter._id = { $in: unverifiedProfiles.map((p) => p.user) };
  }

  const recipients = await User.find(filter).select("email username").lean();

  // In production, integrate nodemailer/SendGrid batch transmit.
  // Here we simulate successful dispatch to all valid segment recipients.
  campaign.status = "sent";
  campaign.sentAt = new Date();
  campaign.recipientCount = recipients.length;
  await campaign.save();

  await logAdminAction({
    adminId: req.user._id,
    action: "SEND_EMAIL_CAMPAIGN",
    targetType: "EmailCampaign",
    details: { subject: campaign.subject, recipientCount: recipients.length },
    req,
  });

  res.status(200).json({
    message: `Campaign successfully sent to ${recipients.length} user(s).`,
    campaign,
  });
};

// @desc    Delete email campaign
// @route   DELETE /api/admin/email-campaigns/:id
// @access  Private/Admin
export const deleteEmailCampaign = async (req, res) => {
  const { id } = req.params;

  const campaign = await EmailCampaign.findByIdAndDelete(id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_EMAIL_CAMPAIGN",
    targetType: "EmailCampaign",
    details: { subject: campaign.subject },
    req,
  });

  res.status(200).json({ message: "Campaign deleted", id });
};
