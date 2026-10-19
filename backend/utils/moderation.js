import Blocklist from "../models/blocklistModel.js";

// Small, self-contained profanity/harassment word list. Not exhaustive — this
// is a first line of defense, not a replacement for human moderation via the
// admin report queue.
const BANNED_WORDS = [
  "fuck", "fucking", "fucker", "shit", "bitch", "asshole", "bastard",
  "cunt", "whore", "slut", "nigger", "nigga", "faggot", "retard",
  "rape", "kill yourself", "kys",
];

const BANNED_PATTERN = new RegExp(
  `\\b(${BANNED_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`,
  "i"
);

export function containsBannedContent(text) {
  if (!text || typeof text !== "string") return false;
  return BANNED_PATTERN.test(text);
}

// In-memory cache for admin-managed blocklist rules with a 15-second TTL
let cachedBlocklist = null;
let cacheExpiry = 0;

export async function getActiveBlocklist() {
  const now = Date.now();
  if (cachedBlocklist && cacheExpiry > now) {
    return cachedBlocklist;
  }
  try {
    cachedBlocklist = await Blocklist.find({}).lean();
    cacheExpiry = now + 15000;
    return cachedBlocklist;
  } catch (err) {
    console.error("[Moderation] Failed to load blocklist from DB:", err.message);
    return cachedBlocklist || [];
  }
}

/**
 * Moderates text against both hardcoded banned words and admin-configured Blocklist entries.
 * Returns: { blocked: boolean, text: string, flagged: boolean, reason?: string }
 */
export async function moderateContent(text) {
  if (!text || typeof text !== "string") {
    return { blocked: false, text: text || "", flagged: false };
  }

  // 1. Check hardcoded prohibited words
  if (containsBannedContent(text)) {
    return {
      blocked: true,
      text,
      flagged: true,
      reason: "Message contains prohibited language.",
    };
  }

  // 2. Check dynamic admin blocklist
  const rules = await getActiveBlocklist();
  let modifiedText = text;
  let isFlagged = false;

  for (const rule of rules) {
    if (!rule.phrase) continue;
    const escaped = rule.phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    if (regex.test(modifiedText)) {
      if (rule.action === "block") {
        return {
          blocked: true,
          text,
          flagged: true,
          reason: `Your message contains restricted terms (${rule.category}).`,
        };
      } else if (rule.action === "replace") {
        const replacement = rule.replacement || "***";
        modifiedText = modifiedText.replace(regex, replacement);
      } else if (rule.action === "flag") {
        isFlagged = true;
      }
    }
  }

  return { blocked: false, text: modifiedText, flagged: isFlagged };
}

