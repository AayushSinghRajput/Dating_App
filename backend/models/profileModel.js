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
    // Discovery hard-filter preferences — who this user wants to see. Applied
    // reciprocally: a candidate only passes the age filter if the viewer is
    // also within the candidate's own range. Distance isn't here yet since
    // the schema has no geo coordinates to filter on.
    preferences: {
      minAge: { type: Number, default: 18, min: 18 },
      maxAge: { type: Number, default: 99, min: 18 },
    },
    // Icebreaker prompts (Hinge-style): a short question + the user's answer,
    // shown on their profile/discovery card so matches have something
    // specific to reply to instead of a cold "hi".
    prompts: {
      type: [
        {
          question: { type: String, required: true },
          answer: { type: String, required: true, maxlength: 300 },
        },
      ],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 3,
        message: "You can add up to 3 prompts.",
      },
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
// Supports the discovery hard-filter query (age range + gender/interestedIn).
profileSchema.index({ age: 1, gender: 1, interestedIn: 1 });

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
