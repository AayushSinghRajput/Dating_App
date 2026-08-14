// One-off dev utility: fully reset swipe/match history between two test
// accounts so they become eligible for each other in discovery again.
// Clears likes/passes/superLikes/matches on both sides (buildAlreadySwipedMatch
// excludes on all four, not just matches) and deletes any chat/messages
// between them, mirroring matchController.js's unmatchProfile but also
// covering likes/passes which that endpoint intentionally leaves alone.
// Usage: node scripts/resetSwipeHistory.js userA@example.com [userB@example.com]
// If userB is omitted, resolves to "the other profile" — fine when there are
// only two test accounts in the DB.
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";

dotenv.config();

async function main() {
  const [emailA, emailB] = process.argv.slice(2);
  if (!emailA) {
    console.log("Usage: node scripts/resetSwipeHistory.js userA@example.com [userB@example.com]");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  const userA = await User.findOne({ email: emailA });
  if (!userA) {
    console.log(`${emailA} not found`);
    return;
  }
  const userB = emailB ? await User.findOne({ email: emailB }) : await User.findOne({ _id: { $ne: userA._id } });
  if (!userB) {
    console.log("Could not resolve the other user");
    return;
  }

  const [profileA, profileB] = await Promise.all([
    Profile.findOne({ user: userA._id }),
    Profile.findOne({ user: userB._id }),
  ]);
  if (!profileA || !profileB) {
    console.log("One or both profiles not found");
    return;
  }

  const idA = profileA._id.toString();
  const idB = profileB._id.toString();
  const strip = (arr, id) => arr.filter((x) => x.toString() !== id);

  for (const key of ["likes", "passes", "superLikes", "matches"]) {
    profileA[key] = strip(profileA[key], idB);
    profileB[key] = strip(profileB[key], idA);
  }
  await Promise.all([profileA.save(), profileB.save()]);
  console.log(`Cleared likes/passes/superLikes/matches between ${emailA} and ${userB.email}`);

  const chat = await Chat.findOne({ participants: { $all: [userA._id, userB._id] } });
  if (chat) {
    await Message.deleteMany({ chat: chat._id });
    await Chat.findByIdAndDelete(chat._id);
    console.log("Deleted existing chat/messages between them");
  }

  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
