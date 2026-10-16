// Dev/Ops utility: Create a brand new admin user or promote an existing user.
// Usage: node scripts/createAdmin.js <email> <password> [username]
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const username = process.argv[4] || (email ? email.split("@")[0] : "admin");

  if (!email || !password) {
    console.log("Usage: node scripts/createAdmin.js <email> <password> [username]");
    console.log("Example: node scripts/createAdmin.js admin@example.com password123 soulmateAdmin");
    process.exit(1);
  }

  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is not set in environment or .env file.");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB.");

  let user = await User.findOne({ email });

  if (user) {
    user.isAdmin = true;
    user.password = password; // Pre-save hook will hash this
    user.emailVerified = true;
    if (username) user.username = username;
    await user.save();
    console.log(`Updated existing user ${user.email} (${user.username}) as admin with new password.`);
  } else {
    user = await User.create({
      username,
      email,
      password,
      isAdmin: true,
      emailVerified: true,
      termsAcceptedAt: new Date(),
    });
    console.log(`Successfully created new admin user ${user.email} (${user.username})!`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed to setup admin user:", err);
  process.exit(1);
});
