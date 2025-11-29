import Profile from "../models/profileModel.js";

/**
 * Like a profile
 * - Adds targetProfileId to likes[]
 * - If the target has already liked you, create a match
 */
export const likeProfile = async (req, res) => {
  try {
    const { targetProfileId } = req.body;
    const currentUserId = req.user.id; 
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!currentProfile)
      return res.status(404).json({ message: "Current profile not found" });

    if (currentProfile.likes.includes(targetProfileId)) {
      return res.status(200).json({ message: "Already liked this profile" });
    }

    // Add to likes
    currentProfile.likes.push(targetProfileId);
    await currentProfile.save();

    // Check if target also liked current user (mutual like = match)
    const targetProfile = await Profile.findById(targetProfileId);

    let isMatch = false;

    if (targetProfile && targetProfile.likes.includes(currentProfile._id)) {
      // Add to both matches array
      currentProfile.matches.addToSet(targetProfile._id);
      targetProfile.matches.addToSet(currentProfile._id);
      await currentProfile.save();
      await targetProfile.save();
      isMatch = true;
    }

    res.status(200).json({
      message: isMatch ? "It's a Match! 🎉" : "Profile liked",
      match: isMatch,
    });
  } catch (error) {
    console.error("Error liking profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Pass a profile
 * - Adds targetProfileId to passes[]
 */
export const passProfile = async (req, res) => {
  try {
    const { targetProfileId } = req.body;
    const currentUserId = req.user.id;
    const currentProfile = await Profile.findOne({ user: currentUserId });

    if (!currentProfile)
      return res.status(404).json({ message: "Current profile not found" });

    if (currentProfile.passes.includes(targetProfileId)) {
      return res.status(200).json({ message: "Already passed this profile" });
    }

    currentProfile.passes.push(targetProfileId);
    await currentProfile.save();

    res.status(200).json({ message: "Profile passed successfully" });
  } catch (error) {
    console.error("Error passing profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all matches for the logged-in user
 */
export const getMatches = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentProfile = await Profile.findOne({ user: currentUserId })
      .populate("matches", "user profileImage location age");

    if (!currentProfile)
      return res.status(404).json({ message: "Profile not found" });

    res.status(200).json({
      matches: currentProfile.matches,
    });
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ message: "Server error" });
  }
};
