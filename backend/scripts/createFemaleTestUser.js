// One-off dev utility:
//  1. Reverts Aayush's profile back to gender=male, interestedIn=women
//     (it was flipped to female/male earlier purely to unblock testing
//     between the two existing male/interestedIn=women test accounts).
//  2. Creates a brand-new female/interestedIn=male test account so both
//     Bishal and Aayush (both male, interested in women) can see her in
//     discovery — age, lifestyle.smoking, and coordinates are set to
//     satisfy both existing accounts' age range, "smoking" dealbreaker,
//     and 100km distance filter.
// Usage: node scripts/createFemaleTestUser.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";

dotenv.config();

const NEW_USER_EMAIL = "priya@example.com";
const NEW_USER_PASSWORD = "test1234";

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const aayushUser = await User.findOne({ email: "aayush@example.com" });
  if (aayushUser) {
    const aayushProfile = await Profile.findOne({ user: aayushUser._id });
    if (aayushProfile) {
      aayushProfile.gender = "male";
      aayushProfile.interestedIn = "women";
      await aayushProfile.save();
      console.log("Reverted Aayush to gender=male, interestedIn=women");
    }
  }

  const existing = await User.findOne({ email: NEW_USER_EMAIL });
  if (existing) {
    console.log(`${NEW_USER_EMAIL} already exists — skipping creation`);
    await mongoose.disconnect();
    return;
  }

  const newUser = await User.create({
    username: "priya",
    email: NEW_USER_EMAIL,
    password: NEW_USER_PASSWORD,
    termsAcceptedAt: new Date(),
    emailVerified: true,
  });

  await Profile.create({
    user: newUser._id,
    name: "Priya Gurung",
    gender: "female",
    interestedIn: "male",
    age: 24,
    location: "Kathmandu",
    aboutMe: "Test account for discovery QA.",
    relationshipGoals: "Dating",
    profession: "Designer",
    lifestyle: { smoking: "no", drinking: "socially", pets: "have pets", wantsChildren: "yes" },
    coordinates: { type: "Point", coordinates: [85.34, 27.68] },
  });

  console.log(`Created ${NEW_USER_EMAIL} (password: ${NEW_USER_PASSWORD}), gender=female, interestedIn=male`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
