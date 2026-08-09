import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
      unique: true, 
    },
    name: {
      type: String,
    },
    profileImage: {
      type: String,
      default: "",
    },
    photos: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
    },
    aboutMe: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "non-binary","other"],
    },
    interestedIn: {
      type: String,
      enum: ["male", "women", "everyone"],
    },
    age: {
      type: Number,
    },
    hobbies: {
      type: [String],
    },
    education: {
      type: String,
    },
    profession: {
      type: String,
    },
    relationshipGoals: {
      type: String,
    },
    favorites:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
      }
    ],
    likes:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile"
      },
    ],
    passes:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile",
      },
    ],
    matches:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Profile",
      },
    ],
    blockedUsers:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
      }
    ],
    incognito: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationPhoto: {
      type: String,
    },
    superLikes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile",
      },
    ],
    superLikesUsedToday: {
      type: Number,
      default: 0,
    },
    superLikesDate: {
      type: Date,
    },
    likesUsedToday: {
      type: Number,
      default: 0,
    },
    likesDate: {
      type: Date,
    },
    boostedUntil: {
      type: Date,
    },
    lastBoostActivatedAt: {
      type: Date,
    },
    lastSwipe: {
      targetProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      action: { type: String, enum: ["like", "pass"] },
      matched: { type: Boolean, default: false },
      swipedAt: { type: Date },
    },
  },
  { timestamps: true }
);

// getLikedByProfiles queries `{ likes: currentProfile._id }`; getAllProfiles
// filters out incognito profiles on every discovery-feed fetch.
profileSchema.index({ likes: 1 });
profileSchema.index({ incognito: 1 });

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
