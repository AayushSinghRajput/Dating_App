import React, { useEffect, useState } from "react";
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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getMe,
  sendVerificationEmail,
  verifyEmail,
  changeEmail,
  CurrentUserInfo,
} from "@/services/authService";
import DetailHeader from "@/src/components/ui/DetailHeader";

export default function EmailSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);

  // Verification state
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Change email state
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  const loadMe = async () => {
    try {
      const me = await getMe();
      setCurrentUser(me);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Failed to Load Account",
        text2: error?.message || "Could not retrieve user info.",
      });
    }
  };

  useEffect(() => {
    loadMe().finally(() => setLoading(false));
  }, []);

  // Cooldown countdown for resend code
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  const handleBack = () => router.back();

  const isGoogleUser = currentUser?.authProvider === "google";
  const emailVerified = currentUser?.emailVerified ?? false;
  const currentEmail = currentUser?.email ?? "";

  const handleSendCode = async () => {
    if (sendingCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSendingCode(true);

    try {
      await sendVerificationEmail();
      setCodeSent(true);
      setResendCountdown(60);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Verification Code Sent!",
        text2: `A 6-digit code was sent to ${currentEmail}`,
      });
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Could Not Send Code",
        text2: error?.message || "Please try again later.",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (verifying || code.trim().length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setVerifying(true);

    try {
      await verifyEmail(code.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Email Verified!",
        text2: "Your Soulmate account is now fully protected.",
      });
      setCodeSent(false);
      setCode("");
      await loadMe();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: error?.message || "Invalid or expired verification code.",
      });
    } finally {
      setVerifying(false);
    }
  };

  const isNewEmailValid =
    newEmail.trim().length > 3 &&
    newEmail.includes("@") &&
    newEmail.includes(".") &&
    newEmail.trim().toLowerCase() !== currentEmail.toLowerCase();

  const canChangeEmail = isNewEmailValid && password.length > 0 && !changingEmail;

  const handleChangeEmail = async () => {
    if (!canChangeEmail) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setChangingEmail(true);

    try {
      const result = await changeEmail(newEmail.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Email Address Updated",
        text2: "Please verify your new email to secure your account.",
      });
      setNewEmail("");
      setPassword("");
      setShowChangeEmail(false);
      setCodeSent(false);
      setCode("");
      setCurrentUser((prev) =>
        prev ? { ...prev, email: result.email, emailVerified: false } : null
      );
      await loadMe();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Could Not Update Email",
        text2: error?.message || "Incorrect password or email already in use.",
      });
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Email & Verification" onBack={handleBack} />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading account security details...
          </Text>
        </View>
      ) : isGoogleUser ? (
        /* Google OAuth User State */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroOuter}>
            <LinearGradient
              colors={["#0284c7", "#0ea5e9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroTopRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="logo-google" size={24} color="#ffffff" />
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>GOOGLE VERIFIED</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Verified via Google</Text>
              <Text style={styles.heroSubtitle}>
                Your email is authenticated and securely synced with Google. Your matches and notifications are protected by Google identity security.
              </Text>
            </LinearGradient>
          </View>

          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.statusRow}>
              <View style={[styles.iconWrap, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="mail" size={22} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Primary Email</Text>
                <Text style={[styles.emailValue, { color: colors.text }]}>{currentEmail}</Text>
              </View>
            </View>

            <View style={[styles.verifiedPill, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="checkmark-circle" size={16} color="#10b981" />
              <Text style={[styles.verifiedPillText, { color: "#065f46" }]}>
                Verified & Protected
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.actionBtnOuter}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              Linking.openURL("https://myaccount.google.com").catch(() => {});
            }}
          >
            <LinearGradient
              colors={["#0284c7", "#38bdf8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="open-outline" size={18} color="#ffffff" />
              <Text style={styles.actionBtnText}>Manage Google Account</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      ) : (
        /* Standard Local Account User State */
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Trust Banner */}
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
                    <Text style={styles.heroPillText}>ACCOUNT RECOVERY & SAFETY</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Your Dating Safeguard</Text>
                <Text style={styles.heroSubtitle}>
                  A verified email ensures you can always recover your account, receive match alerts, and maintain full profile ownership.
                </Text>
              </LinearGradient>
            </View>

            {/* Current Email Status Card */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.statusRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="mail" size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>
                    Current Account Email
                  </Text>
                  <Text style={[styles.emailValue, { color: colors.text }]}>
                    {currentEmail}
                  </Text>
                </View>

                {/* Status Badge */}
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: emailVerified ? "#d1fae5" : "#fef3c7",
                      borderColor: emailVerified ? "#10b981" : "#f59e0b",
                    },
                  ]}
                >
                  <Ionicons
                    name={emailVerified ? "checkmark-circle" : "alert-circle"}
                    size={15}
                    color={emailVerified ? "#059669" : "#d97706"}
                  />
                  <Text
                    style={[
                      styles.statusBadgeText,
                      { color: emailVerified ? "#065f46" : "#92400e" },
                    ]}
                  >
                    {emailVerified ? "VERIFIED" : "UNVERIFIED"}
                  </Text>
                </View>
              </View>

              {/* Status Explanation */}
              <View
                style={[
                  styles.statusNoteBox,
                  {
                    backgroundColor: emailVerified ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
                  },
                ]}
              >
                <Ionicons
                  name={emailVerified ? "lock-closed-outline" : "warning-outline"}
                  size={16}
                  color={emailVerified ? "#059669" : "#d97706"}
                />
                <Text
                  style={[
                    styles.statusNoteText,
                    { color: emailVerified ? colors.text : colors.text },
                  ]}
                >
                  {emailVerified
                    ? "Your email is verified. Instant account recovery and security alerts are fully enabled."
                    : "Your email is not verified yet. Verify now to prevent losing your chats and profile."}
                </Text>
              </View>

              {/* Unverified Flow: Send Code / Enter OTP */}
              {!emailVerified && (
                <View style={styles.verificationFlowWrap}>
                  {!codeSent ? (
                    <Pressable
                      style={({ pressed }) => [
                        styles.actionBtnOuter,
                        sendingCode && { opacity: 0.6 },
                        pressed && !sendingCode && { transform: [{ scale: 0.99 }] },
                      ]}
                      onPress={handleSendCode}
                      disabled={sendingCode}
                    >
                      <LinearGradient
                        colors={["#e63946", "#ff6b78"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.actionGradient}
                      >
                        {sendingCode ? (
                          <>
                            <ActivityIndicator size="small" color="#ffffff" />
                            <Text style={styles.actionBtnText}>Sending Code...</Text>
                          </>
                        ) : (
                          <>
                            <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
                            <Text style={styles.actionBtnText}>Send Verification Code</Text>
                          </>
                        )}
                      </LinearGradient>
                    </Pressable>
                  ) : (
                    /* OTP Entry */
                    <View style={styles.otpBox}>
                      <Text style={[styles.fieldLabel, { color: colors.text }]}>
                        Enter 6-Digit Code
                      </Text>

                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            backgroundColor: colors.surfaceAlt,
                            borderColor: code ? colors.accent : colors.border,
                          },
                        ]}
                      >
                        <Ionicons name="keypad-outline" size={20} color={colors.accent} />
                        <TextInput
                          placeholder="123456"
                          placeholderTextColor={colors.textTertiary}
                          keyboardType="number-pad"
                          maxLength={6}
                          value={code}
                          onChangeText={setCode}
                          style={[styles.input, { color: colors.text }]}
                        />
                      </View>

                      {/* Verify Button */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.actionBtnOuter,
                          (!code || verifying) && { opacity: 0.5 },
                          pressed && code && !verifying && { transform: [{ scale: 0.99 }] },
                        ]}
                        onPress={handleVerify}
                        disabled={!code || verifying}
                      >
                        <LinearGradient
                          colors={["#10b981", "#34d399"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.actionGradient}
                        >
                          {verifying ? (
                            <>
                              <ActivityIndicator size="small" color="#ffffff" />
                              <Text style={styles.actionBtnText}>Verifying...</Text>
                            </>
                          ) : (
                            <>
                              <Ionicons name="checkmark-circle" size={19} color="#ffffff" />
                              <Text style={styles.actionBtnText}>Confirm Verification</Text>
                            </>
                          )}
                        </LinearGradient>
                      </Pressable>

                      {/* Resend Option */}
                      <View style={styles.resendRow}>
                        <Text style={[styles.resendNotice, { color: colors.textSecondary }]}>
                          Didn&apos;t receive the email?
                        </Text>
                        <Pressable
                          disabled={resendCountdown > 0 || sendingCode}
                          onPress={handleSendCode}
                        >
                          <Text
                            style={[
                              styles.resendBtnText,
                              {
                                color:
                                  resendCountdown > 0
                                    ? colors.textTertiary
                                    : colors.accent,
                              },
                            ]}
                          >
                            {resendCountdown > 0
                              ? `Resend in ${resendCountdown}s`
                              : "Resend Code"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Change Email Section */}
            <View
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Pressable
                style={styles.accordionHeader}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setShowChangeEmail((prev) => !prev);
                }}
              >
                <View style={styles.accordionLeft}>
                  <View style={[styles.iconWrapSmall, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name="swap-horizontal-outline" size={18} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      Change Email Address
                    </Text>
                    <Text style={[styles.accordionSubtitle, { color: colors.textSecondary }]}>
                      Update the address linked to your Soulmate account
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={showChangeEmail ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textTertiary}
                />
              </Pressable>

              {showChangeEmail && (
                <View style={styles.changeEmailForm}>
                  <View style={[styles.noticeCard, { backgroundColor: colors.surfaceAlt }]}>
                    <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.noticeText, { color: colors.textSecondary }]}>
                      Updating your email requires confirming your current password. Your new address will require verification.
                    </Text>
                  </View>

                  {/* New Email Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>
                      New Email Address
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: isNewEmailValid ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={19}
                        color={isNewEmailValid ? colors.accent : colors.textTertiary}
                      />
                      <TextInput
                        placeholder="newemail@example.com"
                        placeholderTextColor={colors.textTertiary}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        value={newEmail}
                        onChangeText={setNewEmail}
                        style={[styles.input, { color: colors.text }]}
                      />
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={[styles.fieldLabel, { color: colors.text }]}>
                      Current Password Confirmation
                    </Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: colors.surfaceAlt,
                          borderColor: password ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={19}
                        color={password ? colors.accent : colors.textTertiary}
                      />
                      <TextInput
                        placeholder="Enter password to verify"
                        placeholderTextColor={colors.textTertiary}
                        secureTextEntry={!showPassword}
                        value={password}
                        onChangeText={setPassword}
                        style={[styles.input, { color: colors.text }]}
                      />
                      <Pressable
                        onPress={() => setShowPassword((p) => !p)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showPassword ? "eye-outline" : "eye-off-outline"}
                          size={19}
                          color={colors.textTertiary}
                        />
                      </Pressable>
                    </View>
                  </View>

                  {/* Submit Update Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtnOuter,
                      !canChangeEmail && { opacity: 0.5 },
                      pressed && canChangeEmail && { transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={handleChangeEmail}
                    disabled={!canChangeEmail || changingEmail}
                  >
                    <LinearGradient
                      colors={["#e63946", "#ff6b78"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.actionGradient}
                    >
                      {changingEmail ? (
                        <>
                          <ActivityIndicator size="small" color="#ffffff" />
                          <Text style={styles.actionBtnText}>Updating Email...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle-outline" size={19} color="#ffffff" />
                          <Text style={styles.actionBtnText}>Update & Save Email</Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Reassurance Footer */}
            <View style={styles.footerNoteWrap}>
              <Ionicons name="shield-outline" size={15} color={colors.textTertiary} />
              <Text style={[styles.footerNoteText, { color: colors.textSecondary }]}>
                Soulmate safeguards your email with strict encryption. We will never share your address or send unsolicited promotions to your inbox.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    marginBottom: 14,
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
    fontSize: 13.5,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 19,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    gap: 14,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapSmall: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  emailValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  verifiedPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusNoteBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusNoteText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  verificationFlowWrap: {
    marginTop: 4,
    gap: 12,
  },
  otpBox: {
    gap: 10,
    marginTop: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14.5,
  },
  actionBtnOuter: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 4,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  actionBtnText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginTop: 2,
  },
  resendNotice: {
    fontSize: 12,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accordionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accordionSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  changeEmailForm: {
    gap: 14,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(150, 150, 150, 0.2)",
  },
  noticeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 16,
    flex: 1,
  },
  footerNoteWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 22,
    marginTop: 10,
    gap: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
