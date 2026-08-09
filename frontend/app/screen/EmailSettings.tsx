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
} from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getMe,
  sendVerificationEmail,
  verifyEmail,
  changeEmail,
} from "@/utils/api";

export default function EmailSettings() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [changingEmail, setChangingEmail] = useState(false);

  const loadMe = () => {
    return getMe()
      .then((me) => {
        setEmail(me.email);
        setEmailVerified(me.emailVerified);
      })
      .catch((error: any) => {
        Toast.show({ type: "error", text1: "Failed to load account info", text2: error.message });
      });
  };

  useEffect(() => {
    loadMe().finally(() => setLoading(false));
  }, []);

  const handleBack = () => router.back();

  const handleSendCode = async () => {
    if (sendingCode) return;
    setSendingCode(true);
    try {
      await sendVerificationEmail();
      setCodeSent(true);
      Toast.show({ type: "success", text1: "Verification code sent", text2: `Check ${email}` });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't send code", text2: error.message });
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (verifying || code.length === 0) return;
    setVerifying(true);
    try {
      await verifyEmail(code);
      setEmailVerified(true);
      setCodeSent(false);
      setCode("");
      Toast.show({ type: "success", text1: "Email verified" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Verification failed", text2: error.message });
    } finally {
      setVerifying(false);
    }
  };

  const canChangeEmail = newEmail.trim().length > 3 && newEmail.includes("@") && password.length > 0;

  const handleChangeEmail = async () => {
    if (!canChangeEmail || changingEmail) return;
    setChangingEmail(true);
    try {
      const result = await changeEmail(newEmail.trim(), password);
      setEmail(result.email);
      setEmailVerified(false);
      setNewEmail("");
      setPassword("");
      setCodeSent(false);
      setCode("");
      Toast.show({ type: "success", text1: "Email updated", text2: "Please verify your new email." });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't change email", text2: error.message });
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Email & Verification</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Current email status */}
            <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Current Email</Text>
              <Text style={[styles.currentEmail, { color: colors.text }]}>{email}</Text>
              <View style={styles.badgeRow}>
                <Ionicons
                  name={emailVerified ? "checkmark-circle" : "alert-circle"}
                  size={16}
                  color={emailVerified ? colors.success : "#e0a800"}
                />
                <Text
                  style={[
                    styles.badgeText,
                    { color: emailVerified ? colors.success : "#e0a800" },
                  ]}
                >
                  {emailVerified ? "Verified" : "Not verified"}
                </Text>
              </View>

              {!emailVerified && (
                <>
                  {!codeSent ? (
                    <Pressable
                      style={[styles.secondaryButton, { borderColor: colors.accent }]}
                      onPress={handleSendCode}
                      disabled={sendingCode}
                    >
                      {sendingCode ? (
                        <ActivityIndicator color={colors.accent} size="small" />
                      ) : (
                        <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
                          Send verification code
                        </Text>
                      )}
                    </Pressable>
                  ) : (
                    <View style={{ marginTop: 16 }}>
                      <Text style={[styles.label, { color: colors.textSecondary }]}>Enter 6-digit code</Text>
                      <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
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
                      <Pressable
                        style={[
                          styles.submitButton,
                          { backgroundColor: code.length > 0 ? colors.accent : colors.textTertiary },
                        ]}
                        onPress={handleVerify}
                        disabled={code.length === 0 || verifying}
                      >
                        {verifying ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.submitButtonText}>Verify</Text>
                        )}
                      </Pressable>
                      <Pressable onPress={handleSendCode} disabled={sendingCode} style={{ marginTop: 12, alignSelf: "center" }}>
                        <Text style={[styles.resendText, { color: colors.textSecondary }]}>
                          {sendingCode ? "Sending..." : "Resend code"}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Change email */}
            <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Change Email</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Changing your email will require you to verify the new address.
              </Text>

              <Text style={[styles.label, { color: colors.textSecondary }]}>New Email</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TextInput
                  placeholder="new@email.com"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={newEmail}
                  onChangeText={setNewEmail}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>

              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
                <TextInput
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>

              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: canChangeEmail ? colors.accent : colors.textTertiary },
                ]}
                onPress={handleChangeEmail}
                disabled={!canChangeEmail || changingEmail}
              >
                {changingEmail ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Email</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  content: { padding: 20, paddingBottom: 40 },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  sectionDescription: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  currentEmail: { fontSize: 16, fontWeight: "600", marginTop: 8 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  badgeText: { fontSize: 13, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15 },
  secondaryButton: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: { fontWeight: "700", fontSize: 14 },
  submitButton: {
    marginTop: 20,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  resendText: { fontSize: 13, fontWeight: "600" },
});
