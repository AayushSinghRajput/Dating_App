import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { getProfile, submitVerificationSelfie } from "@/services/profileService";
import DetailHeader from "@/src/components/ui/DetailHeader";

interface PosePrompt {
  id: string;
  emoji: string;
  instruction: string;
  tip: string;
}

const POSE_PROMPTS: PosePrompt[] = [
  {
    id: "peace",
    emoji: "✌️",
    instruction: "Make a peace sign next to your face",
    tip: "Hold two fingers up beside your cheek and smile naturally.",
  },
  {
    id: "thumbs",
    emoji: "👍",
    instruction: "Give a thumbs up next to your cheek",
    tip: "Keep your hand and full face clearly visible in good lighting.",
  },
  {
    id: "one_finger",
    emoji: "☝️",
    instruction: "Hold up one finger near your chin",
    tip: "Look straight toward the front camera.",
  },
  {
    id: "heart",
    emoji: "🫶",
    instruction: "Make a heart hand gesture next to your face",
    tip: "Show both your expression and gesture clearly.",
  },
];

export default function PhotoVerification() {
  const router = useRouter();
  const { colors } = useTheme();

  const [promptIndex, setPromptIndex] = useState(() =>
    Math.floor(Math.random() * POSE_PROMPTS.length)
  );
  const currentPose = useMemo(() => POSE_PROMPTS[promptIndex], [promptIndex]);

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [alreadyVerified, setAlreadyVerified] = useState(false);
  const [isReverifying, setIsReverifying] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((profile) => {
        if (mounted && profile?.verified) {
          setAlreadyVerified(true);
        }
      })
      .catch((err) => {
        console.warn("[PhotoVerification] Failed to fetch profile:", err);
      })
      .finally(() => {
        if (mounted) setLoadingProfile(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleShufflePose = () => {
    Haptics.selectionAsync().catch(() => {});
    setPromptIndex((prev) => (prev + 1) % POSE_PROMPTS.length);
  };

  const handleTakeSelfie = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({
        type: "error",
        text1: "Camera Permission Required",
        text2: "Soulmate needs camera access to take your verification selfie.",
      });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotoUri(result.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({
          type: "success",
          text1: "Photo Captured!",
          text2: "Review your selfie below and submit when ready.",
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Camera Unavailable",
        text2: "Could not open camera app on this device.",
      });
    }
  };

  const handleSubmit = async () => {
    if (!photoUri || submitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSubmitting(true);

    try {
      const isVerified = await submitVerificationSelfie(photoUri);
      if (isVerified) {
        setVerifiedSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({
          type: "success",
          text1: "You're Officially Verified!",
          text2: "The blue tick is now active on your Soulmate profile.",
        });
      } else {
        Toast.show({
          type: "info",
          text1: "Verification Submitted",
          text2: "Our Trust & Safety moderators are reviewing your selfie.",
        });
        handleBack();
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: error?.message || "Please make sure your face and pose match the prompt.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Success Screen (just completed verification)
  if (verifiedSuccess) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DetailHeader title="Photo Verification" onBack={handleBack} />

        <View style={styles.celebrationContainer}>
          <View style={styles.celebrationBadgeOuter}>
            <LinearGradient
              colors={["#0284c7", "#38bdf8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.celebrationBadgeGradient}
            >
              <Ionicons name="checkmark-circle" size={54} color="#ffffff" />
            </LinearGradient>
          </View>

          <View style={[styles.verifiedPill, { backgroundColor: "#e0f2fe" }]}>
            <Ionicons name="shield-checkmark" size={14} color="#0284c7" />
            <Text style={[styles.verifiedPillText, { color: "#0284c7" }]}>
              PROFILE VERIFIED
            </Text>
          </View>

          <Text style={[styles.celebrationTitle, { color: colors.text }]}>
            {"You're Officially Verified!"}
          </Text>
          <Text style={[styles.celebrationSubtitle, { color: colors.textSecondary }]}>
            The iconic blue trust badge is now displayed next to your name. Matches know you are 100% genuine, giving you higher visibility in discovery!
          </Text>

          <View style={[styles.verifiedBenefitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.benefitRow}>
              <Ionicons name="sparkles" size={18} color="#0284c7" />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Up to 3x more matches and likes
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="eye" size={18} color="#0284c7" />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Prioritized profile placement in swipe queue
              </Text>
            </View>
            <View style={styles.benefitRow}>
              <Ionicons name="lock-closed" size={18} color="#0284c7" />
              <Text style={[styles.benefitText, { color: colors.text }]}>
                Biometric verification selfie is kept 100% private
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.doneButton}
            onPress={handleBack}
          >
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.doneGradient}
            >
              <Text style={styles.doneButtonText}>Back to Settings</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // 2. Already Verified Screen (returning user)
  if (alreadyVerified && !isReverifying) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <DetailHeader title="Photo Verification" onBack={handleBack} />

        <ScrollView contentContainerStyle={styles.alreadyVerifiedContent} showsVerticalScrollIndicator={false}>
          <View style={styles.alreadyVerifiedCardOuter}>
            <LinearGradient
              colors={["#0284c7", "#0ea5e9", "#38bdf8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alreadyVerifiedCard}
            >
              <View style={styles.verifiedShieldCircle}>
                <Ionicons name="shield-checkmark" size={32} color="#ffffff" />
              </View>
              <Text style={styles.alreadyVerifiedTitle}>Your Profile is Verified</Text>
              <Text style={styles.alreadyVerifiedSubtitle}>
                You already hold the trusted blue badge. Your photos match your verified identity.
              </Text>
            </LinearGradient>
          </View>

          <View style={[styles.perksCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.perksHeading, { color: colors.text }]}>Active Trust Perks</Text>
            <View style={styles.perkItem}>
              <View style={[styles.perkIconWrap, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="checkmark-done-circle" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.perkTitle, { color: colors.text }]}>Blue Trust Badge Active</Text>
                <Text style={[styles.perkDesc, { color: colors.textSecondary }]}>
                  Appears prominently across cards, chats, and discovery
                </Text>
              </View>
            </View>

            <View style={styles.perkItem}>
              <View style={[styles.perkIconWrap, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="trending-up" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.perkTitle, { color: colors.text }]}>Enhanced Match Rate</Text>
                <Text style={[styles.perkDesc, { color: colors.textSecondary }]}>
                  Daters trust verified accounts 70% more
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={[styles.reverifyBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setIsReverifying(true);
            }}
          >
            <Ionicons name="refresh-outline" size={18} color={colors.accent} />
            <Text style={[styles.reverifyBtnText, { color: colors.accent }]}>
              Changed Your Look? Re-Verify Photo
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // 3. Main Photo Verification Capture Flow
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Photo Verification" onBack={handleBack} />

      {loadingProfile ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking verification status...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Value Banner */}
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>ZERO CATFISH PROMISE</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Get Your Blue Trust Badge</Text>
              <Text style={styles.heroSubtitle}>
                Copy the gesture below in a quick selfie to prove you are genuinely you. Verified daters get up to 3x more sparks!
              </Text>
            </LinearGradient>
          </View>

          {/* Pose Challenge Card */}
          <View
            style={[
              styles.poseCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.poseHeaderRow}>
              <View style={styles.poseEmojiCircle}>
                <Text style={styles.poseEmoji}>{currentPose.emoji}</Text>
              </View>

              <View style={styles.poseHeaderText}>
                <Text style={[styles.poseTag, { color: colors.accent }]}>
                  REQUIRED POSE GESTURE
                </Text>
                <Text style={[styles.poseInstruction, { color: colors.text }]}>
                  {currentPose.instruction}
                </Text>
              </View>
            </View>

            <View style={[styles.poseTipBox, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.poseTipText, { color: colors.textSecondary }]}>
                {currentPose.tip}
              </Text>
            </View>

            <Pressable
              style={styles.shufflePoseBtn}
              onPress={handleShufflePose}
            >
              <Ionicons name="shuffle-outline" size={15} color={colors.accent} />
              <Text style={[styles.shufflePoseText, { color: colors.accent }]}>
                Try a Different Pose
              </Text>
            </Pressable>
          </View>

          {/* Photo Capture & Framing Area */}
          <View style={styles.captureSection}>
            <View
              style={[
                styles.photoFrameOuter,
                { borderColor: photoUri ? colors.accent : colors.border },
              ]}
            >
              {photoUri ? (
                <View style={styles.previewWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreviewImage} />
                  <View style={styles.previewOverlayBadge}>
                    <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                    <Text style={styles.previewOverlayText}>Photo Ready</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.photoEmptyPlaceholder, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.cameraIconCircle, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="camera" size={32} color={colors.accent} />
                  </View>
                  <Text style={[styles.placeholderTitle, { color: colors.text }]}>
                    No Selfie Taken Yet
                  </Text>
                  <Text style={[styles.placeholderDesc, { color: colors.textSecondary }]}>
                    Ensure your face and gesture are both clearly inside the frame
                  </Text>
                </View>
              )}
            </View>

            {/* Camera Trigger Buttons */}
            <View style={styles.captureActionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.takeSelfieBtn,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleTakeSelfie}
              >
                <LinearGradient
                  colors={photoUri ? [colors.surfaceAlt, colors.surfaceAlt] : ["#e63946", "#ff6b78"]}
                  style={[
                    styles.takeSelfieGradient,
                    photoUri && { borderWidth: 1, borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name={photoUri ? "refresh-outline" : "camera-outline"}
                    size={20}
                    color={photoUri ? colors.text : "#ffffff"}
                  />
                  <Text
                    style={[
                      styles.takeSelfieText,
                      { color: photoUri ? colors.text : "#ffffff" },
                    ]}
                  >
                    {photoUri ? "Retake Selfie" : "Open Front Camera"}
                  </Text>
                </LinearGradient>
              </Pressable>

              {photoUri && (
                <Pressable
                  style={({ pressed }) => [
                    styles.submitVerificationBtn,
                    submitting && { opacity: 0.65 },
                    pressed && !submitting && { transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <LinearGradient
                    colors={["#0284c7", "#0ea5e9"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitVerificationGradient}
                  >
                    {submitting ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.submitVerificationText}>
                          Verifying Face & Pose...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={19} color="#ffffff" />
                        <Text style={styles.submitVerificationText}>
                          Submit For Verification
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </View>

          {/* Privacy & Safety Reassurance Card */}
          <View
            style={[
              styles.privacyAssuranceCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.privacyAssuranceHeader}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.accent} />
              <Text style={[styles.privacyAssuranceTitle, { color: colors.text }]}>
                Soulmate Biometric Privacy Guarantee
              </Text>
            </View>
            <Text style={[styles.privacyAssuranceDesc, { color: colors.textSecondary }]}>
              Your verification selfie is strictly used to validate your identity. It will never be posted to your public dating profile or visible to matches.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#e63946",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 18,
  },
  poseCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  poseHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 14,
  },
  poseEmojiCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(230, 57, 70, 0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  poseEmoji: {
    fontSize: 28,
  },
  poseHeaderText: {
    flex: 1,
  },
  poseTag: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  poseInstruction: {
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 22,
  },
  poseTipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 10,
  },
  poseTipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  shufflePoseBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  shufflePoseText: {
    fontSize: 13,
    fontWeight: "700",
  },
  captureSection: {
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  photoFrameOuter: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 3,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  previewWrapper: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  photoPreviewImage: {
    width: "100%",
    height: "100%",
  },
  previewOverlayBadge: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  previewOverlayText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  photoEmptyPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  cameraIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  placeholderTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  placeholderDesc: {
    fontSize: 11.5,
    textAlign: "center",
    lineHeight: 15,
  },
  captureActionRow: {
    width: "100%",
    gap: 10,
  },
  takeSelfieBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  takeSelfieGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  takeSelfieText: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  submitVerificationBtn: {
    borderRadius: 14,
    overflow: "hidden",
  },
  submitVerificationGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  submitVerificationText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  privacyAssuranceCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  privacyAssuranceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  privacyAssuranceTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  privacyAssuranceDesc: {
    fontSize: 12,
    lineHeight: 17,
  },

  /* Celebration Screen */
  celebrationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  celebrationBadgeOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
    backgroundColor: "rgba(2, 132, 199, 0.15)",
    marginBottom: 16,
  },
  celebrationBadgeGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  celebrationTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  celebrationSubtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
    maxWidth: 320,
  },
  verifiedBenefitsCard: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 12,
    marginBottom: 28,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  benefitText: {
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  doneButton: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
  },
  doneGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  /* Already Verified Screen */
  alreadyVerifiedContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  alreadyVerifiedCardOuter: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#0284c7",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  alreadyVerifiedCard: {
    padding: 24,
    alignItems: "center",
    borderRadius: 20,
  },
  verifiedShieldCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  alreadyVerifiedTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  alreadyVerifiedSubtitle: {
    fontSize: 13.5,
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 290,
  },
  perksCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  perksHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  perkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  perkIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  perkTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  perkDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  reverifyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 6,
  },
  reverifyBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
