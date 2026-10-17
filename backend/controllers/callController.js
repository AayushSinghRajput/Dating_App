// Default high-availability STUN and fallback TURN servers
const DEFAULT_ICE_SERVERS = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

let cachedMeteredIce = null;
let lastMeteredFetch = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // Cache credentials for 1 hour

/**
 * @desc    Get WebRTC ICE (STUN/TURN) servers for audio/video calling.
 *          Dynamically issues ephemeral TURN credentials from Metered.ca or custom coturn
 *          if configured, preventing hardcoded public demo throttling in production.
 * @route   GET /api/calls/ice-servers
 * @access  Private
 */
export const getIceServers = async (req, res) => {
  try {
    // 1. Dedicated Metered.ca (Official 50GB free tier or custom domain)
    if (process.env.METERED_API_KEY && process.env.METERED_APP_NAME) {
      const now = Date.now();
      if (cachedMeteredIce && now - lastMeteredFetch < CACHE_TTL_MS) {
        return res.status(200).json({ iceServers: cachedMeteredIce });
      }

      try {
        const rawApp = process.env.METERED_APP_NAME.trim();
        const host = rawApp.includes(".") ? rawApp : `${rawApp}.metered.live`;
        let response = await fetch(
          `https://${host}/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY.trim()}`
        );

        // Fallback to legacy .metered.ca if .metered.live fails and no custom domain was given
        if (!response.ok && !rawApp.includes(".")) {
          response = await fetch(
            `https://${rawApp}.metered.ca/api/v1/turn/credentials?apiKey=${process.env.METERED_API_KEY.trim()}`
          );
        }

        // 1A. Try apiKey with GET /api/v1/turn/credentials
        if (response.ok) {
          const meteredServers = await response.json();
          if (Array.isArray(meteredServers) && meteredServers.length > 0) {
            cachedMeteredIce = meteredServers;
            lastMeteredFetch = now;
            return res.status(200).json({ iceServers: meteredServers });
          }
        }

        // 1B. If apiKey failed, try secretKey with POST /api/v1/turn/credential
        const postRes = await fetch(
          `https://${host}/api/v1/turn/credential?secretKey=${process.env.METERED_API_KEY.trim()}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiryInSeconds: 86400 }),
          }
        );

        if (postRes.ok) {
          const creds = await postRes.json();
          if (creds.username && creds.password) {
            const servers = [
              { urls: "stun:stun.relay.metered.ca:80" },
              {
                urls: "turn:global.relay.metered.ca:80",
                username: creds.username,
                credential: creds.password,
              },
              {
                urls: "turn:global.relay.metered.ca:80?transport=tcp",
                username: creds.username,
                credential: creds.password,
              },
              {
                urls: "turn:global.relay.metered.ca:443",
                username: creds.username,
                credential: creds.password,
              },
              {
                urls: "turns:global.relay.metered.ca:443?transport=tcp",
                username: creds.username,
                credential: creds.password,
              },
            ];
            cachedMeteredIce = servers;
            lastMeteredFetch = now;
            return res.status(200).json({ iceServers: servers });
          }
        }
      } catch (meteredErr) {
        console.error("[WebRTC] Failed to fetch ephemeral Metered credentials:", meteredErr.message);
      }
    }

    // 2. Custom coturn or static TURN server
    if (process.env.TURN_SERVER_URL && process.env.TURN_USERNAME && process.env.TURN_PASSWORD) {
      const customServers = [
        { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
        {
          urls: process.env.TURN_SERVER_URL.split(",").map((u) => u.trim()),
          username: process.env.TURN_USERNAME,
          credential: process.env.TURN_PASSWORD,
        },
      ];
      return res.status(200).json({ iceServers: customServers });
    }

    // 3. Fallback default
    res.status(200).json({ iceServers: DEFAULT_ICE_SERVERS });
  } catch (error) {
    console.error("[WebRTC] Error retrieving ICE servers:", error);
    res.status(200).json({ iceServers: DEFAULT_ICE_SERVERS });
  }
};

/**
 * @desc    HTTP endpoint to reject/decline an incoming call.
 *          Used as a fallback and by background notification actions when socket is inactive.
 * @route   POST /api/calls/reject
 * @access  Public
 */
export const rejectCallHttp = async (req, res) => {
  try {
    const { callId, toUserId, fromUserId } = req.body || {};
    if (!callId && !toUserId && !fromUserId) {
      return res.status(400).json({ message: "callId or toUserId is required" });
    }
    const { rejectActiveCall } = await import("../utils/socket.js");
    const io = req.app.get("io");
    await rejectActiveCall(io, callId, toUserId, fromUserId);
    return res.status(200).json({ success: true, message: "Call rejected successfully" });
  } catch (err) {
    console.error("[WebRTC] Error in rejectCallHttp:", err);
    return res.status(500).json({ message: "Failed to reject call" });
  }
};
