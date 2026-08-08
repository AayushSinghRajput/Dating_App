import Profile from "../models/profileModel.js";
import { sendNotification, retractNotification } from "../utils/notify.js";
import { performBlock } from "../utils/block.js";


const MAX_PHOTOS = 6;

//create or update profile
export const createOrUpateProfile = async (req,res) => {
    try {
        const userId = req.user.id;
        const profileData = req.body;

        //enforce minimum age server-side (the onboarding UI also checks this,
        //but that's trivially bypassable by calling the API directly)
        if (profileData.age !== undefined && profileData.age !== "") {
            const age = Number(profileData.age);
            if (Number.isNaN(age) || age < 18) {
                return res.status(400).json({
                    message: "You must be at least 18 years old to use this app.",
                });
            }
        }

        let profile = await Profile.findOne({
            user:userId
        });

        //newly uploaded photos get appended to whatever the user already has
        //(removing/reordering photos is handled by the dedicated endpoints below)
        const newPhotoUrls = (req.files || []).map((f) => f.path);
        if (newPhotoUrls.length > 0) {
            const existingPhotos = profile?.photos || [];
            const mergedPhotos = [...existingPhotos, ...newPhotoUrls].slice(0, MAX_PHOTOS);
            profileData.photos = mergedPhotos;
            profileData.profileImage = mergedPhotos[0];
        }

        if (profile){
            //update existing profile
            profile = await Profile.findOneAndUpdate({
                user:userId
            },profileData,{
                new:true,
                runValidators:true
            });
            return res.status(200).json({
                message:"Profile Updated",profile
            });
        } else {
            //create new profile
            const newProfile = new Profile({
                ...profileData,
                user:userId,
            });
            await newProfile.save();
            return res.status(201).json({
                message:"Profile Created",profile:newProfile
            })
        }
    } catch (error) {
        res.status(500).json({
            message:"Error creating/updating profile",error
        });
        
    }
}



// Get profile by user ID
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await Profile.findOne({ user: userId }).populate("user", "username email");

    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error });
  }
};


//Get all profile
export const getAllProfiles = async (req, res) => {
  try {

    //Get logged-in user ID
    const loggedInUserId = req.user?.id;

    const myProfile = await Profile.findOne({ user: loggedInUserId }).select("blockedUsers");
    const blockedByMe = (myProfile?.blockedUsers || []).map((id) => id.toString());

    //fetch all profiles except the current user
    const allProfiles = await Profile.find({
        user:{$ne:loggedInUserId},
    }).populate("user", "username email");

    // Hide profiles in both directions: people I've blocked, and people who've blocked me
    const profiles = allProfiles.filter((p) => {
      const otherUserId = p.user?._id?.toString();
      if (!otherUserId) return false;
      const iBlockedThem = blockedByMe.includes(otherUserId);
      const theyBlockedMe = p.blockedUsers.some((id) => id.toString() === loggedInUserId);
      return !iBlockedThem && !theyBlockedMe;
    });

    const users = profiles.map(p => ({
      id: p._id,
      userId: p.user && p.user._id,
      name: p.name || (p.user && p.user.username),
      age: p.age,
      profileImage: p.profileImage,
      photos: p.photos,
      profession: p.profession,
      location: p.location,
      aboutMe:p.aboutMe,
      gender:p.gender,
      interestedIn:p.interestedIn,
      hobbies:p.hobbies,
      education:p.education,
      relationshipGoals:p.relationshipGoals,
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:",error);
    res.status(500).json({ message: "Error fetching users", error });
  }
};



/**
 * @desc Toggle favorite user (add or remove)
 * @route POST /api/profile/:targetUserId/favorite
 * @access Private
 */
export const toggleFavorite = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { targetUserId } = req.params;

    if (loggedInUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot favorite yourself." });
    }

    const profile = await Profile.findOne({ user: loggedInUserId });

    if (!profile)
      return res.status(404).json({ message: "Profile not found for this user." });

    const isFavorite = profile.favorites.includes(targetUserId);

    if (isFavorite) {
      // Remove from favorites
      profile.favorites = profile.favorites.filter(
        (id) => id.toString() !== targetUserId
      );
      await profile.save();

      await retractNotification(req.app.get("io"), {
        userId: targetUserId,
        fromUserId: loggedInUserId,
        type: "favorite",
      });

      return res.json({
        message: "Removed from favorites",
        favorites: profile.favorites,
      });
    } else {
      // Add to favorites
      profile.favorites.push(targetUserId);
      await profile.save();

      await sendNotification(req.app.get("io"), {
        userId: targetUserId,
        type: "favorite",
        fromUserId: loggedInUserId,
      });

      return res.json({
        message: "Added to favorites",
        favorites: profile.favorites,
      });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Get all favorite users of the logged-in user
 * @route GET /api/profile/favorites
 * @access Private
 */
export const getFavorites = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const profile = await Profile.findOne({ user: loggedInUserId }).populate(
      "favorites",
      "username email"
    );

    if (!profile)
      return res.status(404).json({ message: "Profile not found for this user." });

    res.json({ favorites: profile.favorites });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Block a user: hides each other from discovery, breaks any existing
 * match/like, and deletes their chat history. Blocking is silent (no notification).
 * @route POST /api/profile/:targetUserId/block
 * @access Private
 */
export const blockUser = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { targetUserId } = req.params;

    if (loggedInUserId === targetUserId) {
      return res.status(400).json({ message: "You cannot block yourself." });
    }

    const blockedUsers = await performBlock(loggedInUserId, targetUserId);

    res.status(200).json({ message: "User blocked", blockedUsers });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

/**
 * @desc Unblock a user
 * @route POST /api/profile/:targetUserId/unblock
 * @access Private
 */
export const unblockUser = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;
    const { targetUserId } = req.params;

    const profile = await Profile.findOne({ user: loggedInUserId });
    if (!profile)
      return res.status(404).json({ message: "Profile not found for this user." });

    profile.blockedUsers = profile.blockedUsers.filter(
      (id) => id.toString() !== targetUserId
    );
    await profile.save();

    res.status(200).json({ message: "User unblocked", blockedUsers: profile.blockedUsers });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Get all users the logged-in user has blocked
 * @route GET /api/profile/blocked
 * @access Private
 */
export const getBlockedUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user.id;

    const profile = await Profile.findOne({ user: loggedInUserId }).populate(
      "blockedUsers",
      "username email"
    );
    if (!profile)
      return res.status(404).json({ message: "Profile not found for this user." });

    const blockedUsers = await Promise.all(
      profile.blockedUsers.map(async (u) => {
        const blockedProfile = await Profile.findOne({ user: u._id }).select(
          "profileImage age location"
        );
        return {
          _id: u._id,
          username: u.username,
          profileImage: blockedProfile?.profileImage || "",
          age: blockedProfile?.age,
          location: blockedProfile?.location,
        };
      })
    );

    res.status(200).json({ blockedUsers });
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Remove a single photo from the logged-in user's profile
 * @route DELETE /api/profile/photos
 * @access Private
 */
export const removePhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "Photo url is required" });

    const profile = await Profile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    profile.photos = profile.photos.filter((p) => p !== url);
    profile.profileImage = profile.photos[0] || "";
    await profile.save();

    res.status(200).json({
      message: "Photo removed",
      photos: profile.photos,
      profileImage: profile.profileImage,
    });
  } catch (error) {
    console.error("Error removing photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Reorder photos so the given one becomes the primary/profile photo
 * @route PATCH /api/profile/photos/primary
 * @access Private
 */
export const setPrimaryPhoto = async (req, res) => {
  try {
    const userId = req.user.id;
    const { url } = req.body;
    if (!url) return res.status(400).json({ message: "Photo url is required" });

    const profile = await Profile.findOne({ user: userId });
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    if (!profile.photos.includes(url)) {
      return res.status(400).json({ message: "Photo not found on this profile" });
    }

    profile.photos = [url, ...profile.photos.filter((p) => p !== url)];
    profile.profileImage = url;
    await profile.save();

    res.status(200).json({
      message: "Primary photo updated",
      photos: profile.photos,
      profileImage: profile.profileImage,
    });
  } catch (error) {
    console.error("Error setting primary photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};
