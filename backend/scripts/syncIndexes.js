import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import Chat from "../models/chatModel.js";
import Message from "../models/messageModel.js";
import Notification from "../models/notificationModel.js";
import Report from "../models/reportModel.js";
import Transaction from "../models/transactionModel.js";
import RecommendationEvent from "../models/recommendationEventModel.js";
import RecommendationImpression from "../models/recommendationImpressionModel.js";

dotenv.config();

const models = [
  { name: "User", model: User },
  { name: "Profile", model: Profile },
  { name: "Chat", model: Chat },
  { name: "Message", model: Message },
  { name: "Notification", model: Notification },
  { name: "Report", model: Report },
  { name: "Transaction", model: Transaction },
  { name: "RecommendationEvent", model: RecommendationEvent },
  { name: "RecommendationImpression", model: RecommendationImpression },
];

async function syncAllIndexes() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully.\n");

  console.log("=================================================");
  console.log("        MONGODB ATLAS INDEX SYNC & AUDIT         ");
  console.log("=================================================\n");

  for (const { name, model } of models) {
    console.log(`Syncing indexes for collection [${model.collection.name}] (${name})...`);
    try {
      await model.syncIndexes();
      const indexes = await model.collection.indexes();
      console.log(`✓ Active indexes (${indexes.length}):`);
      indexes.forEach((idx) => {
        const keys = Object.entries(idx.key)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        const flags = [];
        if (idx.unique) flags.push("unique");
        if (idx.sparse) flags.push("sparse");
        if (idx.expireAfterSeconds) flags.push(`TTL: ${idx.expireAfterSeconds}s`);
        const flagStr = flags.length > 0 ? ` [${flags.join(", ")}]` : "";
        console.log(`   - ${idx.name} (${keys})${flagStr}`);
      });
      console.log("");
    } catch (err) {
      console.error(`✗ Error syncing indexes for ${name}:`, err.message);
    }
  }

  console.log("All collection indexes verified and synchronized.");
  await mongoose.disconnect();
}

syncAllIndexes().catch((err) => {
  console.error("Index sync script error:", err);
  process.exit(1);
});
