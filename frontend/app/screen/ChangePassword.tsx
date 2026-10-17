import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  changePassword,
  getMe,
  forgotPassword,
  resetPassword,
  CurrentUserInfo,
} from "@/services/authService";
import DetailHeader from "@/src/components/ui/DetailHeader";

export default function ChangePassword() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUserInfo | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // In-App Email Password Reset Modal State
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState<"send" | "verify">("send");
  const [sendingCode, setSendingCode] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let mounted = true;
    getMe()
      .then((user) => {
        if (mounted) {
          setCurrentUser(user);
        }
      })
      .catch((err) => {
        console.warn("[ChangePassword] Failed to fetch current user info:", err);
      })
      .finally(() => {
        if (mounted) setLoadingUser(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  // Cooldown countdown for resend code
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const isGoogleUser = currentUser?.authProvider === "google";

  // Password Strength Calculation
  const strength = useMemo(() => {
    if (!newPassword) {
      return { score: 0, label: "", color: colors.border };
    }
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword) || (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword))) {
      score += 1;
    }

    switch (score) {
      case 1:
        return { score: 1, label: "Weak", color: "#ef4444" };
      case 2:
        return { score: 2, label: "Fair", color: "#f59e0b" };
      case 3:
        return { score: 3, label: "Good", color: "#0284c7" };
      case 4:
        return { score: 4, label: "Strong & Secure", color: "#10b981" };
      default:
        return { score: 0, label: "Too Short", color: "#ef4444" };
    }
  }, [newPassword, colors.border]);

  const hasMinLength = newPassword.length >= 6;
  const hasNumberOrSymbol = /[0-9]|[^A-Za-z0-9]/.test(newPassword);
  const hasMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword.length > 0 && newPassword !== currentPassword;

  const canSubmit =
    currentPassword.length > 0 &&
    hasMinLength &&
    newPassword === confirmPassword &&
    !submitting;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/settings");
    }
  };

  const handleToggleCurrent = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowCurrentPassword((prev) => !prev);
  };

  const handleToggleNew = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowNewPassword((prev) => !prev);
  };

  const handleToggleConfirm = () => {
    Haptics.selectionAsync().catch(() => {});
    setShowConfirmPassword((prev) => !prev);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    if (newPassword !== confirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Passwords Do Not Match",
        text2: "Please ensure your new password and confirmation match.",
      });
      return;
    }

    if (newPassword === currentPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Choose a Different Password",
        text2: "Your new password must be different from your current one.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Password Updated!",
        text2: "Your Soulmate account credentials have been securely updated.",
      });
      router.back();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error?.message || "Please check your current password and try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // In-App Email Password Reset Handlers
  const handleOpenResetModal = () => {
    Haptics.selectionAsync().catch(() => {});
    setResetStep("send");
    setResetCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetModalVisible(true);
  };

  const handleSendResetCode = async () => {
    if (!currentUser?.email || sendingCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSendingCode(true);

    try {
      await forgotPassword(currentUser.email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Verification Code Sent",
        text2: `A 6-digit code was sent to ${currentUser.email}`,
      });
      setResetStep("verify");
      setCountdown(60);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Failed to Send Code",
        text2: error?.message || "Please try again later.",
      });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!resetCode.trim() || resetNewPassword.length < 6 || resetting) return;

    if (resetNewPassword !== resetConfirmPassword) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Passwords Do Not Match",
        text2: "Please ensure your new password and confirmation match.",
      });
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setResetting(true);

    try {
      await resetPassword(currentUser!.email.trim(), resetCode.trim(), resetNewPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Toast.show({
        type: "success",
        text1: "Password Reset Successfully!",
        text2: "Your new password is now active.",
      });
      setResetModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: error?.message || "Invalid or expired verification code.",
      });
    } finally {
      setResetting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader title="Change Password" onBack={handleBack} />

      {loadingUser ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Checking account security...
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
                  <Text style={styles.heroPillText}>GOOGLE MANAGED</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>Signed in with Google</Text>
              <Text style={styles.heroSubtitle}>
                Your Soulmate account is linked directly to your Google identity. Google handles your credentials, 2-Factor Authentication, and sign-in credentials.
              </Text>
            </LinearGradient>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="shield-checkmark" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  No Separate Password Required
                </Text>
                <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                  Because you use Google OAuth, your account has no local password to change.
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={[styles.infoIconWrap, { backgroundColor: "#e0f2fe" }]}>
                <Ionicons name="key" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>
                  Account Security
                </Text>
                <Text style={[styles.infoDesc, { color: colors.textSecondary }]}>
                  To update your password or 2FA settings, visit your official Google Account Security dashboard.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            style={styles.googleActionBtn}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              Linking.openURL("https://myaccount.google.com/security").catch(() => {});
            }}
          >
            <LinearGradient
              colors={["#0284c7", "#38bdf8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="open-outline" size={18} color="#ffffff" />
              <Text style={styles.actionButtonText}>
                Open Google Security Settings
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      ) : (
        /* Standard Local Password Form */
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
            {/* Hero Security Card */}
            <View style={styles.heroOuter}>
              <LinearGradient
                colors={["#e63946", "#ff6b78"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroTopRow}>
                  <View style={styles.heroBadge}>
                    <Ionicons name="lock-closed" size={24} color="#ffffff" />
                  </View>
                  <View style={styles.heroPill}>
                    <Text style={styles.heroPillText}>END-TO-END SECURE</Text>
                  </View>
                </View>

                <Text style={styles.heroTitle}>Protect Your Dating Journey</Text>
                <Text style={styles.heroSubtitle}>
                  Keep your matches, private messages, and personal photos safe with a unique, strong password.
                </Text>
              </LinearGradient>
            </View>

            {/* Input Card Container */}
            <View
              style={[
                styles.formCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {/* Current Password Field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>
                    Current Password
                  </Text>
                </View>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: currentPassword ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={currentPassword ? colors.accent : colors.textTertiary}
                  />
                  <TextInput
                    placeholder="Enter your current password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showCurrentPassword}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text }]}
                  />
                  <Pressable
                    onPress={handleToggleCurrent}
                    hitSlop={10}
                    style={styles.eyeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle current password visibility"
                  >
                    <Ionicons
                      name={showCurrentPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {/* In-app Forgot Password button */}
                <Pressable
                  style={styles.forgotPassBtn}
                  onPress={handleOpenResetModal}
                >
                  <Ionicons name="help-circle-outline" size={14} color={colors.accent} />
                  <Text style={[styles.forgotPassText, { color: colors.accent }]}>
                    Forgot your current password?
                  </Text>
                </Pressable>
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: colors.border }]} />

              {/* New Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  New Password
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor: newPassword ? colors.accent : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name="key-outline"
                    size={20}
                    color={newPassword ? colors.accent : colors.textTertiary}
                  />
                  <TextInput
                    placeholder="At least 6 characters"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text }]}
                  />
                  <Pressable
                    onPress={handleToggleNew}
                    hitSlop={10}
                    style={styles.eyeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle new password visibility"
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {/* Password Strength Meter */}
                {newPassword.length > 0 && (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthBarRow}>
                      {[1, 2, 3, 4].map((step) => (
                        <View
                          key={step}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor:
                                strength.score >= step ? strength.color : colors.border,
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <View style={styles.strengthTextRow}>
                      <Text style={[styles.strengthLabel, { color: colors.textSecondary }]}>
                        Password Strength:
                      </Text>
                      <Text style={[styles.strengthValue, { color: strength.color }]}>
                        {strength.label}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Confirm New Password Field */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Confirm New Password
                </Text>

                <View
                  style={[
                    styles.inputWrapper,
                    {
                      backgroundColor: colors.surfaceAlt,
                      borderColor:
                        confirmPassword.length > 0
                          ? hasMatch
                            ? "#10b981"
                            : "#ef4444"
                          : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      confirmPassword.length > 0 && hasMatch
                        ? "checkmark-circle-outline"
                        : "shield-outline"
                    }
                    size={20}
                    color={
                      confirmPassword.length > 0
                        ? hasMatch
                          ? "#10b981"
                          : "#ef4444"
                        : colors.textTertiary
                    }
                  />
                  <TextInput
                    placeholder="Re-enter your new password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.text }]}
                  />
                  <Pressable
                    onPress={handleToggleConfirm}
                    hitSlop={10}
                    style={styles.eyeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle confirm password visibility"
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={colors.textTertiary}
                    />
                  </Pressable>
                </View>

                {/* Match indicator */}
                {confirmPassword.length > 0 && (
                  <View style={styles.matchIndicatorRow}>
                    <Ionicons
                      name={hasMatch ? "checkmark-circle" : "close-circle"}
                      size={14}
                      color={hasMatch ? "#10b981" : "#ef4444"}
                    />
                    <Text
                      style={[
                        styles.matchIndicatorText,
                        { color: hasMatch ? "#10b981" : "#ef4444" },
                      ]}
                    >
                      {hasMatch
                        ? "Passwords match"
                        : "Passwords do not match yet"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Checklist Requirements */}
              <View style={[styles.checklistCard, { backgroundColor: colors.surfaceAlt }]}>
                <Text style={[styles.checklistTitle, { color: colors.text }]}>
                  Password Guidelines
                </Text>

                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasMinLength ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={hasMinLength ? "#10b981" : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.checkItemText,
                      {
                        color: hasMinLength ? colors.text : colors.textSecondary,
                        fontWeight: hasMinLength ? "600" : "400",
                      },
                    ]}
                  >
                    At least 6 characters (8+ recommended)
                  </Text>
                </View>

                <View style={styles.checkItem}>
                  <Ionicons
                    name={hasNumberOrSymbol ? "checkmark-circle" : "ellipse-outline"}
                    size={16}
                    color={hasNumberOrSymbol ? "#10b981" : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.checkItemText,
                      {
                        color: hasNumberOrSymbol ? colors.text : colors.textSecondary,
                        fontWeight: hasNumberOrSymbol ? "600" : "400",
                      },
                    ]}
                  >
                    Include a number or special symbol
                  </Text>
                </View>

                {currentPassword.length > 0 && newPassword.length > 0 && (
                  <View style={styles.checkItem}>
                    <Ionicons
                      name={isDifferentFromCurrent ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={isDifferentFromCurrent ? "#10b981" : "#ef4444"}
                    />
                    <Text
                      style={[
                        styles.checkItemText,
                        {
                          color: isDifferentFromCurrent ? colors.text : "#ef4444",
                          fontWeight: isDifferentFromCurrent ? "600" : "400",
                        },
                      ]}
                    >
                      {isDifferentFromCurrent
                        ? "Different from current password"
                        : "Must not match your current password"}
                    </Text>
                  </View>
                )}
              </View>

              {/* Submit Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.submitBtn,
                  !canSubmit && { opacity: 0.5 },
                  pressed && canSubmit && { transform: [{ scale: 0.99 }] },
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || submitting}
              >
                <LinearGradient
                  colors={["#e63946", "#ff6b78"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitGradient}
                >
                  {submitting ? (
                    <>
                      <ActivityIndicator size="small" color="#ffffff" />
                      <Text style={styles.submitBtnText}>Updating Password...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={19} color="#ffffff" />
                      <Text style={styles.submitBtnText}>Update Password</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Reassurance Footer */}
            <View style={styles.footerNoteWrap}>
              <Ionicons name="lock-closed-outline" size={15} color={colors.textTertiary} />
              <Text style={[styles.footerNoteText, { color: colors.textSecondary }]}>
                Soulmate will never ask for your password via chat or email. Keep your password secret to protect your account.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* In-App Email Password Reset Modal */}
      <Modal
        visible={resetModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setResetModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setResetModalVisible(false)}
          />

          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <View style={[styles.modalIconCircle, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="mail" size={20} color={colors.accent} />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {resetStep === "send" ? "Reset via Email" : "Enter Verification Code"}
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                    {resetStep === "send"
                      ? "Verify ownership using your account email"
                      : `Code sent to ${currentUser?.email || "your email"}`}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => setResetModalVisible(false)}
                hitSlop={10}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceAlt }]}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {resetStep === "send" ? (
              /* Step 1: Send Code */
              <View style={styles.modalBody}>
                <View style={[styles.emailDisplayCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                  <Ionicons name="mail-outline" size={18} color={colors.accent} />
                  <Text style={[styles.emailDisplayText, { color: colors.text }]} numberOfLines={1}>
                    {currentUser?.email || "Registered Account Email"}
                  </Text>
                </View>

                <Text style={[styles.emailInstruction, { color: colors.textSecondary }]}>
                  We will send a 6-digit confirmation code to this address. Once received, enter the code to immediately set a new password without logging out.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.modalPrimaryBtn,
                    sendingCode && { opacity: 0.6 },
                    pressed && !sendingCode && { transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={handleSendResetCode}
                  disabled={sendingCode}
                >
                  <LinearGradient
                    colors={["#e63946", "#ff6b78"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalGradientBtn}
                  >
                    {sendingCode ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.modalBtnText}>Sending Code...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="paper-plane-outline" size={18} color="#ffffff" />
                        <Text style={styles.modalBtnText}>Send 6-Digit Code</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            ) : (
              /* Step 2: Verify & Reset */
              <View style={styles.modalBody}>
                {/* 6-digit Code Input */}
                <View style={styles.modalField}>
                  <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                    6-Digit Verification Code
                  </Text>
                  <View
                    style={[
                      styles.modalInputWrapper,
                      { backgroundColor: colors.surfaceAlt, borderColor: resetCode ? colors.accent : colors.border },
                    ]}
                  >
                    <Ionicons name="keypad-outline" size={19} color={colors.accent} />
                    <TextInput
                      placeholder="Enter 6-digit code"
                      placeholderTextColor={colors.textTertiary}
                      value={resetCode}
                      onChangeText={setResetCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[styles.modalInput, { color: colors.text }]}
                    />
                  </View>
                </View>

                {/* New Password Input */}
                <View style={styles.modalField}>
                  <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                    New Password
                  </Text>
                  <View
                    style={[
                      styles.modalInputWrapper,
                      { backgroundColor: colors.surfaceAlt, borderColor: resetNewPassword ? colors.accent : colors.border },
                    ]}
                  >
                    <Ionicons name="key-outline" size={19} color={colors.accent} />
                    <TextInput
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showResetNewPassword}
                      value={resetNewPassword}
                      onChangeText={setResetNewPassword}
                      autoCapitalize="none"
                      style={[styles.modalInput, { color: colors.text }]}
                    />
                    <Pressable
                      onPress={() => setShowResetNewPassword((p) => !p)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showResetNewPassword ? "eye-outline" : "eye-off-outline"}
                        size={19}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Confirm Password Input */}
                <View style={styles.modalField}>
                  <Text style={[styles.modalFieldLabel, { color: colors.text }]}>
                    Confirm New Password
                  </Text>
                  <View
                    style={[
                      styles.modalInputWrapper,
                      {
                        backgroundColor: colors.surfaceAlt,
                        borderColor:
                          resetConfirmPassword.length > 0
                            ? resetNewPassword === resetConfirmPassword
                              ? "#10b981"
                              : "#ef4444"
                            : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={19}
                      color={
                        resetConfirmPassword.length > 0 && resetNewPassword === resetConfirmPassword
                          ? "#10b981"
                          : colors.textTertiary
                      }
                    />
                    <TextInput
                      placeholder="Re-enter new password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showResetConfirmPassword}
                      value={resetConfirmPassword}
                      onChangeText={setResetConfirmPassword}
                      autoCapitalize="none"
                      style={[styles.modalInput, { color: colors.text }]}
                    />
                    <Pressable
                      onPress={() => setShowResetConfirmPassword((p) => !p)}
                      hitSlop={8}
                    >
                      <Ionicons
                        name={showResetConfirmPassword ? "eye-outline" : "eye-off-outline"}
                        size={19}
                        color={colors.textTertiary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Resend Code Option */}
                <View style={styles.resendRow}>
                  <Text style={[styles.resendNotice, { color: colors.textSecondary }]}>
                    Didn&apos;t get the email?
                  </Text>
                  <Pressable
                    disabled={countdown > 0 || sendingCode}
                    onPress={handleSendResetCode}
                  >
                    <Text
                      style={[
                        styles.resendBtnText,
                        { color: countdown > 0 ? colors.textTertiary : colors.accent },
                      ]}
                    >
                      {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
                    </Text>
                  </Pressable>
                </View>

                {/* Submit Reset Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.modalPrimaryBtn,
                    (!resetCode.trim() || resetNewPassword.length < 6 || resetting) && { opacity: 0.5 },
                    pressed && !resetting && { transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={handleVerifyAndReset}
                  disabled={!resetCode.trim() || resetNewPassword.length < 6 || resetting}
                >
                  <LinearGradient
                    colors={["#e63946", "#ff6b78"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.modalGradientBtn}
                  >
                    {resetting ? (
                      <>
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text style={styles.modalBtnText}>Resetting Password...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={19} color="#ffffff" />
                        <Text style={styles.modalBtnText}>Reset & Save Password</Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  formCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 13.5,
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
    fontSize: 15,
  },
  eyeBtn: {
    padding: 6,
  },
  forgotPassBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 4,
    marginTop: 2,
    paddingVertical: 2,
  },
  forgotPassText: {
    fontSize: 12.5,
    fontWeight: "600",
  },
  fieldDivider: {
    height: 1,
    marginVertical: 4,
  },
  strengthWrap: {
    marginTop: 6,
    gap: 6,
  },
  strengthBarRow: {
    flexDirection: "row",
    gap: 6,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  strengthLabel: {
    fontSize: 11.5,
    fontWeight: "500",
  },
  strengthValue: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  matchIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  matchIndicatorText: {
    fontSize: 12,
    fontWeight: "600",
  },
  checklistCard: {
    borderRadius: 14,
    padding: 14,
    gap: 9,
    marginTop: 4,
  },
  checklistTitle: {
    fontSize: 12.5,
    fontWeight: "700",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  checkItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkItemText: {
    fontSize: 12,
    lineHeight: 16,
  },
  submitBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 10,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  footerNoteWrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 22,
    marginTop: 18,
    gap: 8,
  },
  footerNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  /* Google OAuth State Styles */
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  infoIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  infoDesc: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  googleActionBtn: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    gap: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },

  /* In-App Email Password Reset Modal Styles */
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
    maxWidth: 240,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    gap: 14,
  },
  emailDisplayCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  emailDisplayText: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  emailInstruction: {
    fontSize: 12.5,
    lineHeight: 18,
  },
  modalField: {
    gap: 6,
  },
  modalFieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  modalInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    gap: 10,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14.5,
  },
  resendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  resendNotice: {
    fontSize: 12,
  },
  resendBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalPrimaryBtn: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 6,
  },
  modalGradientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  modalBtnText: {
    color: "#ffffff",
    fontSize: 14.5,
    fontWeight: "700",
  },
});
