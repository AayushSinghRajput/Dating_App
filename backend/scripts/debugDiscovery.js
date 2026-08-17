// One-off dev utility: diagnose why a specific viewer sees no candidates in
// discovery by walking the recommendation pipeline's filter stages one at a
// time and reporting exactly which stage drops each other profile.
// Usage: node scripts/debugDiscovery.js viewer@example.com
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import Profile from "../models/profileModel.js";
import RecommendationEvent from "../models/recommendationEventModel.js";
import {
  buildAgeRangeStages,
  buildPermanentSwipedMatch,
  buildDealbreakerMatch,
  buildDistanceMatch,
  passesGenderReciprocal,
} from "../services/recommendation/hardFilter.js";
import { buildProfileSafetyMatch, excludeBannedUsersMatch } from "../services/recommendation/safetyFilter.js";
import { PASS_COOLDOWN_DAYS } from "../services/recommendation/candidateGenerator.js";

dotenv.config();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log("Usage: node scripts/debugDiscovery.js viewer@example.com");
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  const viewerUser = await User.findOne({ email });
  if (!viewerUser) {
    console.log(`No user found with email ${email}`);
    return;
  }
  const viewerProfile = await Profile.findOne({ user: viewerUser._id }).lean();
  if (!viewerProfile) {
    console.log(`No profile found for ${email}`);
    return;
  }

  console.log("=== Viewer profile ===");
  console.log(JSON.stringify(viewerProfile, null, 2));

  const allOtherProfiles = await Profile.find({ user: { $ne: viewerUser._id } }).lean();
  console.log(`\n=== ${allOtherProfiles.length} other profile(s) in DB ===`);

  const blockedByMe = (viewerProfile.blockedUsers || []).map((id) => new mongoose.Types.ObjectId(id));
  const viewerMinAge = viewerProfile.preferences?.minAge ?? 18;
  const viewerMaxAge = viewerProfile.preferences?.maxAge ?? 99;
  const viewerAge = viewerProfile.age;

  const safetyMatch = buildProfileSafetyMatch(viewerUser._id, blockedByMe);
  const swipedMatch = buildPermanentSwipedMatch(viewerProfile);
  const dealbreakerMatch = buildDealbreakerMatch(viewerProfile);
  const distanceMatch = buildDistanceMatch(viewerProfile);

  const passCooldownSince = new Date(Date.now() - PASS_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const activelyPassedEvents = await RecommendationEvent.find({
    user: viewerUser._id,
    type: "PASS",
    createdAt: { $gte: passCooldownSince },
  })
    .select("targetUser")
    .lean();
  const activelyPassedUserIds = new Set(activelyPassedEvents.map((e) => e.targetUser.toString()));

  console.log("\n=== Filter definitions derived from viewer ===");
  console.log("safetyMatch:", JSON.stringify(safetyMatch));
  console.log("permanentSwipedMatch (likes/superLikes/matches):", JSON.stringify(swipedMatch));
  console.log(`activelyPassedUserIds (within ${PASS_COOLDOWN_DAYS}-day cooldown):`, [...activelyPassedUserIds]);
  console.log("dealbreakerMatch:", JSON.stringify(dealbreakerMatch));
  console.log("distanceMatch:", JSON.stringify(distanceMatch));
  console.log("viewerAge:", viewerAge, "viewerMinAge:", viewerMinAge, "viewerMaxAge:", viewerMaxAge);

  for (const candidate of allOtherProfiles) {
    console.log(`\n--- Candidate: ${candidate.name || candidate._id} (${candidate._id}) ---`);

    const matchesSafety = await Profile.exists({ _id: candidate._id, ...safetyMatch });
    console.log("  passes safetyMatch:", !!matchesSafety);

    const matchesSwiped = await Profile.exists({ _id: candidate._id, ...swipedMatch });
    console.log("  passes permanentSwipedMatch:", !!matchesSwiped);
    console.log("  in pass cooldown:", activelyPassedUserIds.has(candidate.user.toString()));

    const matchesDealbreaker = await Profile.exists({ _id: candidate._id, ...dealbreakerMatch });
    console.log("  passes dealbreakerMatch:", !!matchesDealbreaker);

    const matchesDistance = await Profile.exists({ _id: candidate._id, ...distanceMatch });
    console.log("  passes distanceMatch:", !!matchesDistance, "  candidate.coordinates:", JSON.stringify(candidate.coordinates));

    if (viewerAge) {
      const ageStages = buildAgeRangeStages(viewerAge, viewerMinAge, viewerMaxAge);
      const ageResult = await Profile.aggregate([{ $match: { _id: candidate._id } }, ...ageStages]);
      console.log("  passes ageRangeStages:", ageResult.length > 0, "  candidate.age:", candidate.age, "  candidate.preferences:", JSON.stringify(candidate.preferences));
    } else {
      console.log("  ageRangeStages skipped (viewer has no age set)");
    }

    const candidateUser = await User.findById(candidate.user).select("username banned lastActiveAt").lean();
    console.log("  candidateUser.banned:", candidateUser?.banned, "  found userDoc:", !!candidateUser);

    console.log("  passesGenderReciprocal:", passesGenderReciprocal(viewerProfile, candidate),
      `  (viewer.interestedIn=${viewerProfile.interestedIn}, viewer.gender=${viewerProfile.gender}, candidate.gender=${candidate.gender}, candidate.interestedIn=${candidate.interestedIn})`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
