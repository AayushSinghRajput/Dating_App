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
    // Section 9.6 — GeoJSON Point ([longitude, latitude], in that order per
    // the spec) captured with the user's consent via expo-location. Optional
    // — `location` above remains the free-text display string regardless of
    // whether this is set.
    // No `default` on the inner `type` field deliberately: Mongoose treats
    // this nested object as an implicit embedded schema and applies
    // sub-field defaults as soon as the parent document is hydrated, even
    // when `coordinates` itself was never set — with a default here that
    // reintroduces a bare { type: "Point" } (no coordinates array) on every
    // unrelated save() of a profile with no location, which then fails the
    // 2dsphere index ("Point must be an array or object"). The app always
    // sets both sub-fields together (see profileController.js), so no
    // default is actually needed.
    coordinates: {
      type: { type: String, enum: ["Point"] },
      coordinates: { type: [Number], default: undefined },
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
      // Section 6 — dealbreakers: which of the (currently soft) compatibility
      // signals below this user wants promoted to a hard filter instead.
      // Values are keys into the compatibility signals that support it:
      // "relationshipGoals", "smoking", "drinking", "pets", "wantsChildren".
      dealbreakers: { type: [String], default: [] },
      // Section 9.6 — max discovery distance in km. Null/unset = no limit
      // (and the filter is skipped entirely if either side lacks
      // coordinates — see hardFilter.js).
      maxDistanceKm: { type: Number, default: null, min: 1 },
    },
    // Section 9.4 — lifestyle attributes, all optional/voluntary. Handled
    // carefully per Section 30: these are only ever used for compatibility
    // scoring (and, if the user opts in via preferences.dealbreakers, hard
    // filtering) between two people's own stated choices — never as a basis
    // for showing one group of people fewer recommendations than another.
    lifestyle: {
      smoking: { type: String, enum: ["no", "occasionally", "yes"] },
      drinking: { type: String, enum: ["no", "socially", "yes"] },
      pets: { type: String, enum: ["no pets", "have pets", "want pets"] },
      wantsChildren: { type: String, enum: ["no", "yes", "someday", "not sure"] },
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
// Supports the distance hard filter / distance ranking score.
profileSchema.index({ coordinates: "2dsphere" });

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
