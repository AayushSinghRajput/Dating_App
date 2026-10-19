import DeviceBlacklist from "../models/deviceBlacklistModel.js";

// In-memory cache for banned devices and IPs with a 30s TTL
let blacklistCache = null;
let cacheExpires = 0;

export async function getCachedBlacklist() {
  const now = Date.now();
  if (blacklistCache && cacheExpires > now) {
    return blacklistCache;
  }
  try {
    const list = await DeviceBlacklist.find({}).select("deviceId ipAddress hardwareFingerprint reason").lean();
    blacklistCache = list;
    cacheExpires = now + 30000;
    return list;
  } catch (err) {
    console.error("[DeviceCheck] Error loading device blacklist:", err.message);
    return blacklistCache || [];
  }
}

/**
 * Checks whether the incoming request originates from a blacklisted device or IP address.
 * Returns the matching blacklist record or null.
 */
export async function checkDeviceBlacklist(req) {
  const deviceId = (req.headers["x-device-id"] || req.body?.deviceId || "").toString().trim();
  const hardwareFingerprint = (req.headers["x-hardware-fingerprint"] || req.body?.hardwareFingerprint || "").toString().trim();
  const ip = (req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "").trim();

  if (!deviceId && !hardwareFingerprint && !ip) return null;

  const list = await getCachedBlacklist();

  for (const item of list) {
    if (deviceId && item.deviceId && item.deviceId.toLowerCase() === deviceId.toLowerCase()) {
      return item;
    }
    if (hardwareFingerprint && item.hardwareFingerprint && item.hardwareFingerprint.toLowerCase() === hardwareFingerprint.toLowerCase()) {
      return item;
    }
    if (ip && item.ipAddress && item.ipAddress === ip) {
      return item;
    }
  }

  return null;
}
