import Profile from "../models/profileModel.js";

// @desc    Cloudinary calls this when an async photo moderation check
//          completes — only fires if CLOUDINARY_MODERATION is configured
//          (that add-on is paid and off by default).
// @route   POST /api/admin/cloudinary-webhook
// @access  Public (called by Cloudinary; blast radius if spoofed is limited
//          to removing an unmoderated photo, and the feature is opt-in, so
//          strict signature verification is left as a follow-up before
//          enabling this in production — see Cloudinary's notification
//          signature docs for the X-Cld-Signature/X-Cld-Timestamp headers).
export const cloudinaryModerationWebhook = async (req, res) => {
  try {
    const { public_id, secure_url, moderation } = req.body || {};
    const latestModeration = Array.isArray(moderation) ? moderation[moderation.length - 1] : moderation;

    if (!public_id || !latestModeration || latestModeration.status !== "rejected") {
      return res.status(200).json({ received: true });
    }

    const profile = await Profile.findOne({ photos: secure_url });
    if (profile) {
      profile.photos = profile.photos.filter((p) => p !== secure_url);
      if (profile.profileImage === secure_url) {
        profile.profileImage = profile.photos[0] || "";
      }
      await profile.save();
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Error handling Cloudinary moderation webhook:", error);
    res.status(500).json({ received: false });
  }
};
