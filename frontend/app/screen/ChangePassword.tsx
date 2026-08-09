import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { changePassword } from "@/utils/api";

export default function ChangePassword() {
  const router = useRouter();
  const { colors } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    currentPassword.length > 0 && newPassword.length >= 6 && newPassword === confirmPassword;

  const handleBack = () => router.back();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      Toast.show({ type: "success", text1: "Password changed" });
      router.back();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Couldn't change password", text2: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Change Password</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Current Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              placeholder="Current password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPasswords}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>New Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              placeholder="New password (min. 6 characters)"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPasswords}
              value={newPassword}
              onChangeText={setNewPassword}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm New Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              placeholder="Confirm new password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPasswords}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={[styles.input, { color: colors.text }]}
            />
            <Pressable onPress={() => setShowPasswords((p) => !p)} hitSlop={8}>
              <Ionicons
                name={showPasswords ? "eye" : "eye-off"}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          </View>

          <Pressable
            style={[
              styles.submitButton,
              { backgroundColor: canSubmit ? colors.accent : colors.textTertiary },
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Update Password</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  content: { padding: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  submitButton: {
    marginTop: 32,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
