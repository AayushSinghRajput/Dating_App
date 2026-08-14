// One-off dev utility: make the two current test accounts (bishal@gmail.com,
// male/interestedIn=women) a reciprocal pair by flipping the other profile
// to female/interestedIn=male, and clears bishal's bogus emulator-default
// coordinates + maxDistanceKm (Mountain View, not Kathmandu — see
// scripts/debugDiscovery.js) so the distance hard filter doesn't also
// exclude the pair while that's unresolved.
// Usage: node scripts/fixTestProfiles.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";

dotenv.config();

async function main() {
  await mongoose.connect(process.env.MONGO_URI);

  const bishalUser = await User.findOne({ email: "bishal@gmail.com" });
  if (!bishalUser) {
    console.log("bishal@gmail.com not found");
    return;
  }
  const bishalProfile = await Profile.findOne({ user: bishalUser._id });
  if (!bishalProfile) {
    console.log("bishal's profile not found");
    return;
  }

  const otherProfile = await Profile.findOne({ user: { $ne: bishalUser._id } });
  if (!otherProfile) {
    console.log("No other profile found");
    return;
  }

  console.log(`Flipping ${otherProfile.name} to gender=female, interestedIn=male`);
  otherProfile.gender = "female";
  otherProfile.interestedIn = "male";
  await otherProfile.save();

  console.log("Clearing bishal's bogus emulator-default coordinates and maxDistanceKm");
  bishalProfile.coordinates = undefined;
  if (bishalProfile.preferences) bishalProfile.preferences.maxDistanceKm = null;
  await bishalProfile.save();

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
