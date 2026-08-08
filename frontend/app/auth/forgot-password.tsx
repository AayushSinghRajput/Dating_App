import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StatusBar,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { forgotPassword, resetPassword } from "../../utils/api";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";

const { height } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Please enter your email" });
      return;
    }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim());
      Toast.show({
        type: "success",
        text1: "Check your email",
        text2: "We've sent a 6-digit reset code.",
      });
      setStep("reset");
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    if (newPassword.length < 6) {
      Toast.show({ type: "error", text1: "Password should be at least 6 characters" });
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      Toast.show({ type: "success", text1: "Password reset! Please log in." });
      router.replace("/auth/login");
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <StatusBar barStyle={colors.statusBarStyle} translucent backgroundColor="transparent" />
      <LinearGradient
        colors={["#ff6b6b", "#ff8e8e", "#ffa8a8", "#ffb3ba"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.contentContainer}>
              <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={26} color="#fff" />
              </TouchableOpacity>

              <View style={styles.logoSection}>
                <View style={styles.heartContainer}>
                  <Ionicons name="lock-open" size={54} color="#fff" />
                </View>
              </View>

              <View style={styles.titleSection}>
                <Text style={styles.title}>
                  {step === "request" ? "Forgot Password?" : "Reset Password"}
                </Text>
                <Text style={styles.subtitle}>
                  {step === "request"
                    ? "Enter your email and we'll send you a reset code."
                    : `Enter the code we sent to ${email}`}
                </Text>
              </View>

              <View style={styles.formSection}>
                {step === "request" ? (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <TextInput
                        placeholder="Enter your email"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        style={[
                          styles.textInput,
                          { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow },
                        ]}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, email.trim() && styles.submitBtnActive]}
                      onPress={handleRequestCode}
                      disabled={!email.trim() || submitting}
                    >
                      <Text style={styles.submitText}>
                        {submitting ? "Sending..." : "Send Reset Code"}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Reset Code</Text>
                      <TextInput
                        placeholder="6-digit code"
                        placeholderTextColor={colors.textTertiary}
                        keyboardType="number-pad"
                        maxLength={6}
                        value={code}
                        onChangeText={setCode}
                        style={[
                          styles.textInput,
                          { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow },
                        ]}
                      />
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>New Password</Text>
                      <View style={[styles.passwordWrapper, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                        <TextInput
                          placeholder="New password"
                          placeholderTextColor={colors.textTertiary}
                          secureTextEntry={!showPassword}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          style={{ flex: 1, fontSize: 16, color: colors.text, paddingVertical: 14 }}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ paddingHorizontal: 10 }}>
                          <Ionicons name={showPassword ? "eye" : "eye-off"} size={24} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View style={[styles.passwordWrapper, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
                        <TextInput
                          placeholder="Confirm new password"
                          placeholderTextColor={colors.textTertiary}
                          secureTextEntry={!showPassword}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          style={{ flex: 1, fontSize: 16, color: colors.text, paddingVertical: 14 }}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.submitBtn, styles.submitBtnActive]}
                      onPress={handleResetPassword}
                      disabled={submitting}
                    >
                      <Text style={styles.submitText}>
                        {submitting ? "Resetting..." : "Reset Password"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.resendRow} onPress={handleRequestCode} disabled={submitting}>
                      <Text style={styles.resendText}>Didn&apos;t get a code? Resend</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContainer: { flexGrow: 1, padding: 24, paddingTop: 60 },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: height - 120,
  },
  backButton: { alignSelf: "flex-start", padding: 8, marginBottom: 10 },
  logoSection: { alignItems: "center", marginTop: 10, marginBottom: 20 },
  heartContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  titleSection: { alignItems: "center", marginBottom: 30, paddingHorizontal: 10 },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
  },
  formSection: { width: "100%", maxWidth: 320 },
  inputContainer: { marginBottom: 16 },
  inputLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 8,
  },
  textInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 56,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  submitBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
  submitBtnActive: {
    backgroundColor: "rgba(255,106,136,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  resendRow: { alignItems: "center", marginTop: 16 },
  resendText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
