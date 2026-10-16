import Ticket from "../models/ticketModel.js";
import { logAdminAction } from "../utils/auditLogger.js";
import Profile from "../models/profileModel.js";

const PAGE_SIZE = 20;

// @desc    List all tickets with filters
// @route   GET /api/admin/tickets?status=&priority=&category=&search=&page=
// @access  Private/Admin
export const listTickets = async (req, res) => {
  const { status = "", priority = "", category = "", search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (search.trim()) {
    filter.$or = [
      { subject: { $regex: search.trim(), $options: "i" } },
      { body: { $regex: search.trim(), $options: "i" } },
    ];
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .populate("user", "username email")
      .populate("assignedTo", "username email")
      .sort({ priority: -1, createdAt: -1 })
      .skip((pageNum - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Ticket.countDocuments(filter),
  ]);

  // Attach profile images
  const userIds = tickets.map((t) => t.user?._id?.toString()).filter(Boolean);
  const profiles = await Profile.find({ user: { $in: userIds } })
    .select("user profileImage name")
    .lean();
  const profileMap = Object.fromEntries(profiles.map((p) => [p.user.toString(), p]));

  const enriched = tickets.map((t) => ({
    ...t,
    user: { ...t.user, profile: profileMap[t.user?._id?.toString()] || null },
  }));

  res.status(200).json({ tickets: enriched, total, page: pageNum, pageSize: PAGE_SIZE });
};

// @desc    Get a single ticket with replies
// @route   GET /api/admin/tickets/:ticketId
// @access  Private/Admin
export const getTicket = async (req, res) => {
  const ticket = await Ticket.findById(req.params.ticketId)
    .populate("user", "username email isPremium")
    .populate("assignedTo", "username email")
    .lean();

  if (!ticket) return res.status(404).json({ message: "Ticket not found" });
  res.status(200).json(ticket);
};

// @desc    Admin reply to a ticket
// @route   POST /api/admin/tickets/:ticketId/reply
// @access  Private/Admin
export const replyToTicket = async (req, res) => {
  const { body, status } = req.body;
  if (!body?.trim()) return res.status(400).json({ message: "Reply body is required" });

  const ticket = await Ticket.findById(req.params.ticketId);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  ticket.replies.push({ author: req.user._id, authorRole: "admin", body: body.trim() });

  if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
    ticket.status = status;
    if (status === "resolved") ticket.resolvedAt = new Date();
  } else if (ticket.status === "open") {
    ticket.status = "in_progress";
  }

  await ticket.save();
  await ticket.populate("user", "username email");
  await ticket.populate("assignedTo", "username email");

  await logAdminAction({
    adminId: req.user._id,
    action: "TICKET_REPLY",
    targetId: ticket._id,
    targetType: "Ticket",
    details: { status: ticket.status },
    req,
  });

  res.status(200).json(ticket);
};

// @desc    Update ticket status or priority
// @route   PATCH /api/admin/tickets/:ticketId
// @access  Private/Admin
export const updateTicket = async (req, res) => {
  const { status, priority, assignedTo } = req.body;

  const ticket = await Ticket.findById(req.params.ticketId);
  if (!ticket) return res.status(404).json({ message: "Ticket not found" });

  if (status) {
    ticket.status = status;
    if (status === "resolved") ticket.resolvedAt = new Date();
  }
  if (priority) ticket.priority = priority;
  if (assignedTo !== undefined) ticket.assignedTo = assignedTo || null;

  await ticket.save();
  await ticket.populate("user", "username email");
  await ticket.populate("assignedTo", "username email");

  res.status(200).json(ticket);
};

// @desc    Get ticket stats summary
// @route   GET /api/admin/tickets/stats
// @access  Private/Admin
export const getTicketStats = async (req, res) => {
  const stats = await Ticket.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);

  const result = { open: 0, in_progress: 0, resolved: 0, closed: 0, total: 0 };
  stats.forEach((s) => {
    result[s._id] = s.count;
    result.total += s.count;
  });

  res.status(200).json(result);
};
