// Stage 1 of the discovery pipeline (see recommendation/index.js) — safety
// and account eligibility. This is deliberately deterministic and separate
// from ranking: nothing downstream can ever score a candidate back into
// eligibility once this stage has excluded them.
//
// Excludes: the viewer themselves, anyone blocked in either direction,
// incognito profiles, and banned users. Reported users are covered too,
// since reporting auto-blocks (see backend/controllers/reportController.js).

// Mongo $match conditions expressible directly against the Profile
// collection (no join required).
export function buildProfileSafetyMatch(viewerUserId, blockedByMeIds) {
  return {
    user: { $ne: viewerUserId, $nin: blockedByMeIds },
    incognito: { $ne: true },
    blockedUsers: { $ne: viewerUserId },
  };
}

// Banned status lives on the User document, not Profile — applied as a
// $match after the $lookup that joins userDoc in candidateGenerator.js.
export const excludeBannedUsersMatch = {
  "userDoc.banned": { $ne: true },
};
