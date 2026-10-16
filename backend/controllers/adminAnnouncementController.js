import Announcement from "../models/announcementModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List all announcements for admin panel
// @route   GET /api/admin/announcements
// @access  Private/Admin
export const listAnnouncements = async (req, res) => {
  const announcements = await Announcement.find({})
    .populate("createdBy", "username email")
    .sort({ priority: -1, createdAt: -1 })
    .lean();

  res.status(200).json({ announcements });
};

// @desc    Create a new announcement banner
// @route   POST /api/admin/announcements
// @access  Private/Admin
export const createAnnouncement = async (req, res) => {
  const {
    title,
    message,
    type = "info",
    targetSegment = "all",
    ctaText,
    ctaLink,
    active = true,
    priority = 1,
    startDate,
    endDate,
  } = req.body;

  if (!title || !message) {
    return res.status(400).json({ message: "Title and message are required" });
  }

  const announcement = await Announcement.create({
    title,
    message,
    type,
    targetSegment,
    ctaText,
    ctaLink,
    active,
    priority: Number(priority) || 1,
    startDate: startDate || new Date(),
    endDate: endDate || null,
    createdBy: req.user._id,
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "CREATE_ANNOUNCEMENT",
    targetType: "Announcement",
    details: { title, type, targetSegment },
    req,
  });

  res.status(201).json({ message: "Announcement created", announcement });
};

// @desc    Update or toggle announcement
// @route   PATCH /api/admin/announcements/:id
// @access  Private/Admin
export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;

  const announcement = await Announcement.findByIdAndUpdate(id, req.body, { new: true });
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "UPDATE_ANNOUNCEMENT",
    targetType: "Announcement",
    details: { title: announcement.title, active: announcement.active },
    req,
  });

  res.status(200).json({ message: "Announcement updated", announcement });
};

// @desc    Delete announcement
// @route   DELETE /api/admin/announcements/:id
// @access  Private/Admin
export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;

  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_ANNOUNCEMENT",
    targetType: "Announcement",
    details: { title: announcement.title },
    req,
  });

  res.status(200).json({ message: "Announcement deleted", id });
};

// @desc    Get currently active announcements for app users
// @route   GET /api/announcements/active
// @access  Public
export const getActiveAnnouncements = async (req, res) => {
  const now = new Date();
  const filter = {
    active: true,
    startDate: { $lte: now },
    $or: [{ endDate: { $exists: false } }, { endDate: null }, { endDate: { $gt: now } }],
  };

  const announcements = await Announcement.find(filter)
    .sort({ priority: -1, createdAt: -1 })
    .limit(5)
    .lean();

  res.status(200).json({ announcements });
};
