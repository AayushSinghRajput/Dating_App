import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      required: true,
      unique: true, 
    },
    profileImage: {
      type: String,
      default: "",
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
  },
  { timestamps: true }
);

const Profile = mongoose.model("Profile", profileSchema);
export default Profile;
