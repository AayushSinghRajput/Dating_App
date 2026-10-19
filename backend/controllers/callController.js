// Default high-availability STUN servers
const DEFAULT_ICE_SERVERS = [
  {
    urls: [
      "stun:stun.l.google.com:19302",
      "stun:stun1.l.google.com:19302",
      "stun:stun2.l.google.com:19302",
      "stun:stun.cloudflare.com:3478",
    ],
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
 * @access  Public
 */
export const getIceServers = async (req, res) => {
  try {
    // 1. Dedicated Metered.ca (Official free/pro tier)
    if (process.env.METERED_API_KEY && process.env.METERED_APP_NAME) {
      const now = Date.now();
      if (cachedMeteredIce && now - lastMeteredFetch < CACHE_TTL_MS) {
        return res.status(200).json({ iceServers: cachedMeteredIce });
      }

      try {
        const rawApp = process.env.METERED_APP_NAME.trim();
        const host = rawApp.includes(".") ? rawApp : `${rawApp}.metered.live`;
        const key = process.env.METERED_API_KEY.trim();

        // 1A. Try secretKey with POST /api/v1/turn/credential
        let postRes = await fetch(
          `https://${host}/api/v1/turn/credential?secretKey=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ expiryInSeconds: 86400 }),
          }
        );

        if (!postRes.ok && !rawApp.includes(".")) {
          postRes = await fetch(
            `https://${rawApp}.metered.ca/api/v1/turn/credential?secretKey=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ expiryInSeconds: 86400 }),
            }
          );
        }

        if (postRes.ok) {
          const creds = await postRes.json();
          if (creds.username && creds.password) {
            const servers = [
              {
                urls: [
                  "stun:stun.l.google.com:19302",
                  "stun:stun1.l.google.com:19302",
                  "stun:stun.relay.metered.ca:80",
                ],
              },
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

        // 1B. Fallback to GET /api/v1/turn/credentials?apiKey=
        const getRes = await fetch(`https://${host}/api/v1/turn/credentials?apiKey=${key}`);
        if (getRes.ok) {
          const meteredServers = await getRes.json();
          if (Array.isArray(meteredServers) && meteredServers.length > 0) {
            cachedMeteredIce = meteredServers;
            lastMeteredFetch = now;
            return res.status(200).json({ iceServers: meteredServers });
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
 * @desc    HTTP endpoint to retrieve SDP offer for an active call.
 *          Used as a resilient fallback by the receiver when the push notification
 *          or socket didn't include/relay the offer.
 * @route   GET /api/calls/:callId/offer
 * @access  Public
 */
export const getCallOfferHttp = async (req, res) => {
  try {
    const { callId } = req.params;
    if (!callId) {
      return res.status(400).json({ message: "callId is required" });
    }
    const { getActiveCall } = await import("../utils/socket.js");
    const call = getActiveCall(callId);
    if (!call) {
      return res.status(404).json({ active: false, message: "Call not found or ended" });
    }
    return res.status(200).json({
      active: true,
      callId,
      offer: call.offer || null,
      callType: call.callType,
      fromUserId: call.callerId,
      chatId: call.chatId,
    });
  } catch (err) {
    console.error("[WebRTC] Error in getCallOfferHttp:", err);
    return res.status(500).json({ message: "Failed to retrieve call offer" });
  }
};

/**
 * @desc    HTTP endpoint to relay call answer from receiver to caller.
 *          Used as a reliable fallback when socket is reconnecting or on another connection.
 * @route   POST /api/calls/answer
 * @access  Public
 */
export const answerCallHttp = async (req, res) => {
  try {
    const { callId, toUserId, answer } = req.body || {};
    if (!callId || !answer) {
      return res.status(400).json({ message: "callId and answer are required" });
    }
    const { getActiveCall } = await import("../utils/socket.js");
    const call = getActiveCall(callId);
    if (call) {
      call.answeredAt = Date.now();
    }
    const io = req.app.get("io");
    const targetUserId = toUserId || call?.callerId;
    if (io && targetUserId) {
      io.to(targetUserId.toString()).emit("callAnswered", { answer, callId });
    }
    return res.status(200).json({ success: true, message: "Call answered successfully" });
  } catch (err) {
    console.error("[WebRTC] Error in answerCallHttp:", err);
    return res.status(500).json({ message: "Failed to relay answer" });
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

/**
 * @desc    HTTP endpoint to end/cancel an active or ringing call.
 *          Used as a fallback when socket disconnects or during rapid caller hangup.
 * @route   POST /api/calls/end
 * @access  Public
 */
export const endCallHttp = async (req, res) => {
  try {
    const { callId, toUserId } = req.body || {};
    if (!callId && !toUserId) {
      return res.status(400).json({ message: "callId or toUserId is required" });
    }
    const { endActiveCall } = await import("../utils/socket.js");
    const io = req.app.get("io");
    await endActiveCall(io, callId, toUserId);
    return res.status(200).json({ success: true, message: "Call ended successfully" });
  } catch (err) {
    console.error("[WebRTC] Error in endCallHttp:", err);
    return res.status(500).json({ message: "Failed to end call" });
  }
};
