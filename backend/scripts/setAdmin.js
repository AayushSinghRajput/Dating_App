// One-off dev utility: grant/revoke admin access to a user by email.
// Usage: node scripts/setAdmin.js user@example.com [--revoke]
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

async function main() {
  const email = process.argv[2];
  const revoke = process.argv.includes("--revoke");

  if (!email) {
    console.log("Usage: node scripts/setAdmin.js user@example.com [--revoke]");
    console.log("\nExisting users:");
    await mongoose.connect(process.env.MONGO_URI);
    const users = await User.find({}).select("username email isAdmin");
    users.forEach((u) => console.log(`  ${u.email}  (${u.username})${u.isAdmin ? "  [admin]" : ""}`));
    await mongoose.disconnect();
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate(
    { email },
    { isAdmin: !revoke },
    { new: true }
  ).select("username email isAdmin");

  if (!user) {
    console.log(`No user found with email ${email}`);
  } else {
    console.log(`${user.email} (${user.username}) isAdmin = ${user.isAdmin}`);
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
