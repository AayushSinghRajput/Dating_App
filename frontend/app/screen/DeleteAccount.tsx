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
import { deleteAccount } from "@/utils/api";

export default function DeleteAccount() {
  const router = useRouter();
  const { colors } = useTheme();
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = password.length > 0 && confirmText.trim().toUpperCase() === "DELETE";

  const handleBack = () => router.back();

  const handleDelete = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await deleteAccount(password);
      Toast.show({ type: "success", text1: "Account deleted" });
      router.replace("/auth/login");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Couldn't delete account",
        text2: error.message,
      });
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Delete Account</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={[styles.warningCard, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
            <Ionicons name="warning-outline" size={22} color={colors.accent} />
            <Text style={[styles.warningText, { color: colors.text }]}>
              This permanently deletes your profile, matches, chats, and notifications. This
              action cannot be undone.
            </Text>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Enter your password to confirm
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { color: colors.text }]}
            />
            <Pressable onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
              <Ionicons
                name={showPassword ? "eye" : "eye-off"}
                size={20}
                color={colors.textTertiary}
              />
            </Pressable>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Type <Text style={{ fontWeight: "700" }}>DELETE</Text> to confirm
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <TextInput
              placeholder="DELETE"
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="characters"
              value={confirmText}
              onChangeText={setConfirmText}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          <Pressable
            style={[
              styles.deleteButton,
              { backgroundColor: canSubmit ? "#e63946" : colors.textTertiary },
            ]}
            onPress={handleDelete}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.deleteButtonText}>Permanently Delete My Account</Text>
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
  warningCard: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 24,
  },
  warningText: { flex: 1, fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8, marginTop: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
  },
  deleteButton: {
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
