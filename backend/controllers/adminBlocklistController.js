import Blocklist from "../models/blocklistModel.js";
import { logAdminAction } from "../utils/auditLogger.js";

// @desc    List blocklisted phrases with category filter & search
// @route   GET /api/admin/blocklist?category=&search=&page=
// @access  Private/Admin
export const listBlocklist = async (req, res) => {
  const { category = "all", search = "", page = "1" } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 30;

  const filter = {};
  if (category && category !== "all") {
    filter.category = category;
  }
  if (search.trim()) {
    filter.phrase = { $regex: search.trim(), $options: "i" };
  }

  const [phrases, total, categoryCountsRaw] = await Promise.all([
    Blocklist.find(filter)
      .populate("addedBy", "username email")
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Blocklist.countDocuments(filter),
    Blocklist.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
  ]);

  const categoryCounts = Object.fromEntries(categoryCountsRaw.map((c) => [c._id, c.count]));

  res.status(200).json({
    phrases,
    total,
    page: pageNum,
    pageSize,
    categoryCounts,
  });
};

// @desc    Add a phrase or keyword to blocklist
// @route   POST /api/admin/blocklist
// @access  Private/Admin
export const addBlocklistPhrase = async (req, res) => {
  const { phrase, category = "profanity", action = "replace", replacement = "***" } = req.body;

  if (!phrase || !phrase.trim()) {
    return res.status(400).json({ message: "Phrase is required" });
  }

  const cleanPhrase = phrase.trim().toLowerCase();
  const existing = await Blocklist.findOne({ phrase: cleanPhrase });
  if (existing) {
    return res.status(400).json({ message: "This phrase is already in the blocklist" });
  }

  const item = await Blocklist.create({
    phrase: cleanPhrase,
    category,
    action,
    replacement: replacement || "***",
    addedBy: req.user._id,
  });

  await logAdminAction({
    adminId: req.user._id,
    action: "ADD_BLOCKLIST_PHRASE",
    targetType: "Blocklist",
    details: { phrase: cleanPhrase, category, action },
    req,
  });

  res.status(201).json({ message: "Keyword added to blocklist", item });
};

// @desc    Delete a phrase from blocklist
// @route   DELETE /api/admin/blocklist/:id
// @access  Private/Admin
export const deleteBlocklistPhrase = async (req, res) => {
  const { id } = req.params;

  const item = await Blocklist.findByIdAndDelete(id);
  if (!item) return res.status(404).json({ message: "Phrase not found in blocklist" });

  await logAdminAction({
    adminId: req.user._id,
    action: "DELETE_BLOCKLIST_PHRASE",
    targetType: "Blocklist",
    details: { phrase: item.phrase },
    req,
  });

  res.status(200).json({ message: "Phrase removed from blocklist", id });
};

// @desc    Live test text against blocklist rules
// @route   POST /api/admin/blocklist/test
// @access  Private/Admin
export const testBlocklistFilter = async (req, res) => {
  const { text = "" } = req.body;
  if (!text) {
    return res.status(200).json({ sanitizedText: "", matches: [], violatesRules: false });
  }

  const allRules = await Blocklist.find({}).lean();
  let sanitizedText = text;
  const matches = [];

  for (const rule of allRules) {
    const escaped = rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    if (regex.test(sanitizedText)) {
      matches.push({
        phrase: rule.phrase,
        category: rule.category,
        action: rule.action,
      });

      if (rule.action === "replace") {
        sanitizedText = sanitizedText.replace(regex, rule.replacement || "***");
      }
    }
  }

  const violatesRules = matches.some((m) => m.action === "block");

  res.status(200).json({
    originalText: text,
    sanitizedText,
    matches,
    violatesRules,
  });
};
