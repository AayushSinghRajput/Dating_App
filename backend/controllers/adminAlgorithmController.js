import {
  ALGORITHM_VERSION,
  RANKING_WEIGHTS,
  RANKING_WEIGHT_VARIANTS,
  EXPLORATION_RATIO,
  DIVERSITY_WINDOW,
} from "../services/recommendation/rankingWeights.js";
import { explainRecommendation } from "../services/recommendation/explainer.js";
import RecommendationImpression from "../models/recommendationImpressionModel.js";
import Profile from "../models/profileModel.js";

// @desc    Get current recommendation ranking weights, A/B variants, and exploration configuration
// @route   GET /api/admin/algorithm
// @access  Private/Admin
export const getAlgorithmConfig = async (req, res) => {
  const [totalImpressions, variantCounts] = await Promise.all([
    RecommendationImpression.countDocuments({}),
    RecommendationImpression.aggregate([
      {
        $group: {
          _id: "$experimentVariant",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const variantDistribution = {};
  variantCounts.forEach((v) => {
    variantDistribution[v._id || "control"] = v.count;
  });

  res.status(200).json({
    version: ALGORITHM_VERSION,
    defaultWeights: RANKING_WEIGHTS,
    variants: RANKING_WEIGHT_VARIANTS,
    explorationRatio: EXPLORATION_RATIO,
    diversityWindow: DIVERSITY_WINDOW,
    totalImpressionsLogged: totalImpressions,
    variantDistribution,
  });
};

// @desc    Simulate or inspect ranking explanation between two users
// @route   POST /api/admin/algorithm/explain
// @access  Private/Admin
export const explainMatchPair = async (req, res) => {
  const { viewerId, targetUserId } = req.body;

  if (!viewerId || !targetUserId) {
    return res.status(400).json({ message: "Both viewerId and targetUserId are required." });
  }

  const [viewer, target, explanation, latestImpression] = await Promise.all([
    Profile.findOne({ user: viewerId }).select("name user photos profileImage hobbies").lean(),
    Profile.findOne({ user: targetUserId }).select("name user photos profileImage hobbies").lean(),
    explainRecommendation(viewerId, targetUserId),
    RecommendationImpression.findOne({
      requestingUser: viewerId,
      recommendedUser: targetUserId,
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  if (!viewer || !target) {
    return res.status(404).json({ message: "One or both user profiles not found." });
  }

  res.status(200).json({
    viewer,
    target,
    reasons: explanation.reasons || [],
    impressionFound: Boolean(latestImpression),
    recordedFeatures: latestImpression?.features || null,
    recordedScore: latestImpression?.score || null,
    experimentVariant: latestImpression?.experimentVariant || "control",
  });
};
