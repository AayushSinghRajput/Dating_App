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
