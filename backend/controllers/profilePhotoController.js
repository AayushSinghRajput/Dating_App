import Profile from "../models/profileModel.js";

// @desc    Remove a single photo from the logged-in user's profile
// @route   DELETE /api/profile/photos
// @access  Private
export const removePhoto = async (req, res) => {
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
};

// @desc    Reorder photos so the given one becomes the primary/profile photo
// @route   PATCH /api/profile/photos/primary
// @access  Private
export const setPrimaryPhoto = async (req, res) => {
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
};

// @desc    Submit a verification selfie. This is a self-attestation flow (no
// third-party face-matching service is configured), so submitting a valid
// photo immediately marks the profile as verified.
// @route   POST /api/profile/verify
// @access  Private
export const verifyProfilePhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "A selfie photo is required" });
  }

  const profile = await Profile.findOneAndUpdate(
    { user: req.user.id },
    { verified: true, verificationPhoto: req.file.path },
    { new: true }
  );
  if (!profile) return res.status(404).json({ message: "Profile not found" });

  res.status(200).json({ message: "Profile verified", verified: profile.verified });
};
