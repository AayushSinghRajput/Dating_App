import Profile from "../models/profileModel.js";


//create or update profile
export const createOrUpateProfile = async (req,res) => {
    try {
        const userId = req.user.id;
        const profileData = req.body;

        //if file uploaded, store its URL from Cloudinary
        if(req.file && req.file.path){
            profileData.profileImage  = req.file.path;
        }

        let profile = await Profile.findOne({
            user:userId
        });
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

    //fetch all profiles except the current user
    const profiles = await Profile.find({
        user:{$ne:loggedInUserId},
    }).populate("user", "username email");

    const users = profiles.map(p => ({
      id: p._id,
      name: p.name || (p.user && p.user.username),
      age: p.age,
      profileImage: p.profileImage,
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
      return res.json({
        message: "Removed from favorites",
        favorites: profile.favorites,
      });
    } else {
      // Add to favorites
      profile.favorites.push(targetUserId);
      await profile.save();
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
