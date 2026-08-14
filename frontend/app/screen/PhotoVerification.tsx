import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/contexts/ThemeContext";
import { submitVerificationSelfie } from "@/services/profileService";

const PROMPTS = [
  "Hold up 1 finger next to your face",
  "Hold up 2 fingers next to your face",
  "Give a thumbs up next to your face",
  "Make a peace sign next to your face",
];

export default function PhotoVerification() {
  const router = useRouter();
  const { colors } = useTheme();
  const prompt = useMemo(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)], []);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleBack = () => router.back();

  const handleTakeSelfie = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Toast.show({ type: "error", text1: "Camera permission is required to verify your photo" });
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.[0]) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Couldn't open camera", text2: "No camera app is available on this device." });
    }
  };

  const handleSubmit = async () => {
    if (!photoUri || submitting) return;
    setSubmitting(true);
    try {
      const isVerified = await submitVerificationSelfie(photoUri);
      setVerified(isVerified);
      Toast.show({ type: "success", text1: "You're verified!" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Verification failed", text2: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (verified) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="checkmark-circle" size={64} color={colors.accent} />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>You&apos;re verified!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
            A verified badge now appears next to your name on your profile.
          </Text>
          <Pressable
            style={[styles.submitButton, { backgroundColor: colors.accent }]}
            onPress={() => router.back()}
          >
            <Text style={styles.submitButtonText}>Done</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Photo Verification</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.promptCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.promptLabel, { color: colors.textSecondary }]}>Your pose</Text>
          <Text style={[styles.promptText, { color: colors.text }]}>{prompt}</Text>
          <Text style={[styles.promptHint, { color: colors.textTertiary }]}>
            This helps confirm the photo is really you, taken right now.
          </Text>
        </View>

        <View style={styles.photoArea}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Ionicons name="camera-outline" size={40} color={colors.textTertiary} />
            </View>
          )}
        </View>

        <Pressable
          style={[styles.secondaryButton, { borderColor: colors.accent }]}
          onPress={handleTakeSelfie}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>
            {photoUri ? "Retake Photo" : "Take Selfie"}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: photoUri ? colors.accent : colors.textTertiary },
          ]}
          onPress={handleSubmit}
          disabled={!photoUri || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Verification</Text>
          )}
        </Pressable>
      </ScrollView>
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
  content: { padding: 20, paddingBottom: 40 },
  promptCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  promptLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  promptText: { fontSize: 20, fontWeight: "700", marginTop: 8 },
  promptHint: { fontSize: 13, marginTop: 8, lineHeight: 18 },
  photoArea: { alignItems: "center", marginBottom: 20 },
  photoPreview: { width: 220, height: 220, borderRadius: 110 },
  photoPlaceholder: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  secondaryButtonText: { fontWeight: "700", fontSize: 14 },
  submitButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  submitButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  successContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  successTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  successSubtitle: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 32 },
});
