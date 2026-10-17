import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { deleteAccount, getMe, CurrentUserInfo } from "@/services/authService";
import DetailHeader from "@/src/components/ui/DetailHeader";

const REASONS = [
  { id: "found_love", label: "I found someone / my partner 💍" },
  { id: "break", label: "Taking a break from dating 🌿" },
  { id: "few_matches", label: "Not getting enough matches 📉" },
  { id: "privacy", label: "Privacy or safety concerns 🛡️" },
  { id: "fresh_start", label: "Starting fresh later 🔄" },
  { id: "other", label: "Something else 💬" },
];

export default function DeleteAccount() {
  const router = useRouter();
  const { colors } = useTheme();

  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (mounted) {
          setCurrentUser(user);
          setLoadingUser(false);
        }
      })
      .catch((err) => {
        console.warn("[DeleteAccount] Failed to fetch user info:", err);
        if (mounted) setLoadingUser(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const isGoogleUser = currentUser?.authProvider === "google";
  const isDeleteConfirmed = confirmText.trim().toUpperCase() === "DELETE";
  const canSubmit = (isGoogleUser || password.length > 0) && isDeleteConfirmed;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleSelectReason = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedReason((prev) => (prev === id ? null : id));
  };

  const confirmDeleteAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    Alert.alert(
      "Final Confirmation",
      "Are you absolutely certain? This will immediately wipe your profile, unmatch all connections, and erase your conversations. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete Everything",
          style: "destructive",
          onPress: performDelete,
        },
      ]
    );
  };

  const performDelete = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await deleteAccount(isGoogleUser ? undefined : password);
      Toast.show({
        type: "success",
        text1: "Account Deleted",
        text2: "Your profile and personal records have been removed.",
      });
      router.replace("/auth/login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Couldn't Delete Account",
        text2: error?.message || "Please verify your password and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Delete Account" onBack={handleBack} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warning Hero Card */}
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={["#e63946", "#ff6b78"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroIconBadge}>
                <Ionicons name="trash-bin-outline" size={26} color="#ffffff" />
              </View>
              <Text style={styles.heroTitle}>{"We're Sad to See You Go"}</Text>
              <Text style={styles.heroSubtitle}>
                Deleting your Soulmate account is irreversible. All of your personal matches, chats, photos, and preferences will be permanently wiped.
              </Text>
            </LinearGradient>
          </View>

          {/* Alternative Suggestion: Pause Profile */}
          <View
            style={[
              styles.pauseCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.pauseCardHeader}>
              <View style={[styles.pauseIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="eye-off-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.pauseCardText}>
                <Text style={[styles.pauseTitle, { color: colors.text }]}>
                  Just Need a Break?
                </Text>
                <Text style={[styles.pauseSubtitle, { color: colors.textSecondary }]}>
                  You can activate Incognito Mode to hide from discovery queues without losing your chats or matches.
                </Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.pauseButton,
                { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                pressed && { opacity: 0.8 },
              ]}
              onPress={() => router.push("/screen/Privacy")}
            >
              <Ionicons name="shield-outline" size={16} color={colors.accent} />
              <Text style={[styles.pauseButtonText, { color: colors.accent }]}>
                Manage Profile Visibility in Privacy
              </Text>
            </Pressable>
          </View>

          {/* What Gets Deleted Checklist */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              What Happens When You Delete
            </Text>

            <View
              style={[
                styles.consequenceCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.consequenceItem}>
                <View style={[styles.consequenceIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="heart-dislike-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.consequenceTextWrap}>
                  <Text style={[styles.consequenceTitle, { color: colors.text }]}>
                    Matches & Conversations Lost
                  </Text>
                  <Text style={[styles.consequenceDesc, { color: colors.textSecondary }]}>
                    All active chat threads, voice messages, and mutual matches are instantly unlinked.
                  </Text>
                </View>
              </View>

              <View style={[styles.consequenceDivider, { backgroundColor: colors.border }]} />

              <View style={styles.consequenceItem}>
                <View style={[styles.consequenceIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="images-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.consequenceTextWrap}>
                  <Text style={[styles.consequenceTitle, { color: colors.text }]}>
                    Profile & Verification Purged
                  </Text>
                  <Text style={[styles.consequenceDesc, { color: colors.textSecondary }]}>
                    Photos, bio, lifestyle badges, and selfie verification records will be expunged.
                  </Text>
                </View>
              </View>

              <View style={[styles.consequenceDivider, { backgroundColor: colors.border }]} />

              <View style={styles.consequenceItem}>
                <View style={[styles.consequenceIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="close-circle-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.consequenceTextWrap}>
                  <Text style={[styles.consequenceTitle, { color: colors.text }]}>
                    Zero Account Recovery
                  </Text>
                  <Text style={[styles.consequenceDesc, { color: colors.textSecondary }]}>
                    Once processed, this action cannot be undone by customer care.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Optional Reason Survey */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Why Are You Leaving? (Optional)
            </Text>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
              Help us improve the Soulmate experience for everyone
            </Text>

            <View style={styles.reasonsGrid}>
              {REASONS.map((r) => {
                const isSelected = selectedReason === r.id;
                return (
                  <Pressable
                    key={r.id}
                    style={[
                      styles.reasonPill,
                      {
                        backgroundColor: isSelected ? colors.accentSoft : colors.surface,
                        borderColor: isSelected ? colors.accent : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectReason(r.id)}
                  >
                    <Text
                      style={[
                        styles.reasonText,
                        { color: isSelected ? colors.accent : colors.text },
                      ]}
                    >
                      {r.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Security Verification & Confirmation Form */}
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Security Verification
            </Text>

            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {loadingUser ? (
                <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.accent} />
              ) : isGoogleUser ? (
                <View
                  style={[
                    styles.oauthNotice,
                    { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="logo-google" size={20} color="#EA4335" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.oauthTitle, { color: colors.text }]}>
                      Authenticated via Google
                    </Text>
                    <Text style={[styles.oauthSubtitle, { color: colors.textSecondary }]}>
                      No password required. Type DELETE below to proceed.
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                    Enter Your Password
                  </Text>
                  <View
                    style={[
                      styles.inputFieldWrap,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={18}
                      color={colors.textTertiary}
                      style={{ marginRight: 10 }}
                    />
                    <TextInput
                      placeholder="Current account password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      style={[styles.textInput, { color: colors.text }]}
                    />
                    <Pressable
                      onPress={() => setShowPassword((p) => !p)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={19}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* DELETE Text Confirmation */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Type <Text style={{ color: colors.accent, fontWeight: "700" }}>DELETE</Text> to confirm
                </Text>
                <View
                  style={[
                    styles.inputFieldWrap,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: isDeleteConfirmed ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color={isDeleteConfirmed ? colors.accent : colors.textTertiary}
                    style={{ marginRight: 10 }}
                  />
                  <TextInput
                    placeholder="DELETE"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={confirmText}
                    onChangeText={setConfirmText}
                    style={[styles.textInput, { color: colors.text }]}
                  />
                  {isDeleteConfirmed && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                  )}
                </View>
              </View>

              {/* Permanent Delete Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.deleteSubmitBtn,
                  !canSubmit && styles.deleteSubmitBtnDisabled,
                  pressed && canSubmit && styles.deleteSubmitBtnPressed,
                ]}
                onPress={confirmDeleteAction}
                disabled={!canSubmit || submitting}
              >
                <LinearGradient
                  colors={canSubmit ? ["#e63946", "#d90429"] : [colors.border, colors.border]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.deleteSubmitGradient}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color={canSubmit ? "#ffffff" : colors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.deleteSubmitText,
                          { color: canSubmit ? "#ffffff" : colors.textTertiary },
                        ]}
                      >
                        Permanently Delete Account
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>

              {/* Keep Account Action */}
              <Pressable
                style={({ pressed }) => [
                  styles.keepAccountBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={handleBack}
              >
                <Text style={[styles.keepAccountText, { color: colors.textSecondary }]}>
                  Nevermind, Keep My Account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    alignItems: "center",
  },
  heroIconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 18,
    textAlign: "center",
  },
  pauseCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  pauseCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  pauseIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pauseCardText: {
    flex: 1,
  },
  pauseTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  pauseSubtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  pauseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  pauseButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionWrap: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  sectionSubheading: {
    fontSize: 12.5,
    marginBottom: 12,
  },
  consequenceCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },
  consequenceItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  consequenceIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  consequenceTextWrap: {
    flex: 1,
  },
  consequenceTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  consequenceDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  consequenceDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  reasonsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  reasonPill: {
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 14,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  formCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
  },
  oauthNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  oauthTitle: {
    fontSize: 13.5,
    fontWeight: "700",
  },
  oauthSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    marginBottom: 6,
  },
  inputFieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  deleteSubmitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  deleteSubmitBtnDisabled: {
    opacity: 0.7,
  },
  deleteSubmitBtnPressed: {
    transform: [{ scale: 0.99 }],
  },
  deleteSubmitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  deleteSubmitText: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  keepAccountBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    marginTop: 4,
  },
  keepAccountText: {
    fontSize: 13.5,
    fontWeight: "600",
  },
});
