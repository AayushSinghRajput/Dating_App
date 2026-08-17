import Profile from "../../models/profileModel.js";

// Below this many likes there isn't enough signal to find a meaningful
// neighbor set — starting value, not a tuned one (Section 42's own
// disclaimer applies here too).
const MIN_LIKES_FOR_CF = 5;
// Bounded neighbor pool, mirroring candidateGenerator.js's
// CANDIDATE_POOL_SIZE philosophy: no fancier retrieval (ANN index, offline
// similarity precomputation, etc.) until real usage numbers justify it.
const NEIGHBOR_POOL_SIZE = 200;
const TOP_K_NEIGHBORS = 20;

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const id of setA) if (setB.has(id)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// Section 14 — memory-based user-user collaborative filtering: "users with
// similar behavior have similar preferences". Runs entirely downstream of
// safety/hard filters — this only ever produces a *score* for a candidate
// already in the caller's eligible pool (see featureExtractor.js's
// collaborativeScore and rankingEngine.js), it never sources or expands who
// is eligible. That keeps every CF-influenced candidate bound by the exact
// same safety/hard-filter guarantees as everyone else (Section 2/6), and
// avoids the query-explosion risk of pulling candidates in from outside the
// pool candidateGenerator.js already built.
//
// Returns a Map<candidateProfileId, score in [0,1]>, or null when there's
// too little data to say anything (cold-start viewer, or no neighbors
// found) — featureExtractor.js treats null the same as "no signal", not
// "bad candidate".
export async function buildCollaborativeSignal(viewerProfile) {
  const viewerLikedIds = (viewerProfile.likes || []).map((id) => id.toString());
  if (viewerLikedIds.length < MIN_LIKES_FOR_CF) return null;

  const viewerLikedSet = new Set(viewerLikedIds);

  // Neighbors: other users who liked at least one profile the viewer also
  // liked.
  const neighbors = await Profile.find({
    _id: { $ne: viewerProfile._id },
    likes: { $in: viewerProfile.likes },
  })
    .select("likes")
    .limit(NEIGHBOR_POOL_SIZE)
    .lean();
  if (neighbors.length === 0) return null;

  const scoredNeighbors = neighbors
    .map((neighbor) => {
      const likes = neighbor.likes.map((id) => id.toString());
      return { likes, similarity: jaccardSimilarity(viewerLikedSet, new Set(likes)) };
    })
    .filter((n) => n.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K_NEIGHBORS);
  if (scoredNeighbors.length === 0) return null;

  // Weighted vote: sum of neighbor-similarity for every similar neighbor who
  // liked that candidate, so a candidate endorsed by several highly-similar
  // neighbors outranks one endorsed by a single loosely-similar neighbor.
  const voteByProfileId = new Map();
  let maxVote = 0;
  for (const neighbor of scoredNeighbors) {
    for (const likedId of neighbor.likes) {
      if (viewerLikedSet.has(likedId)) continue; // viewer already liked this one — not a useful signal
      const newVote = (voteByProfileId.get(likedId) || 0) + neighbor.similarity;
      voteByProfileId.set(likedId, newVote);
      if (newVote > maxVote) maxVote = newVote;
    }
  }
  if (voteByProfileId.size === 0 || maxVote === 0) return null;

  // Normalize into [0, 1] against this signal's own max vote, same
  // "normalized to roughly [0,1]" convention every other feature follows
  // (see featureExtractor.js's top-of-file comment) so rankingEngine's
  // weight for it means the same thing regardless of raw vote magnitude.
  const signalByProfileId = new Map();
  for (const [profileId, vote] of voteByProfileId) {
    signalByProfileId.set(profileId, vote / maxVote);
  }
  return signalByProfileId;
}
