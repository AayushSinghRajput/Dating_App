import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import loggedUser from "../../assets/data/loggedUser";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfileEdit() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState(loggedUser.name);
  const [age, setAge] = useState(String(loggedUser.age));
  const [location, setLocation] = useState(loggedUser.location);
  const [bio, setBio] = useState(loggedUser.bio);
  const [isSaving, setIsSaving] = useState(false);

  const saveProfile = async () => {
    if (!name.trim() || !age.trim() || !location.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
      Alert.alert("Error", "Please enter a valid age between 18 and 100");
      return;
    }

    setIsSaving(true);

    // Simulate API call
    setTimeout(() => {
      console.log("Profile updated:", { name, age: Number(age), location, bio });
      setIsSaving(false);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    }, 1000);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.shadow }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Image Section */}
        <View style={[styles.imageSection, { backgroundColor: colors.surface }]}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: loggedUser.avatar }}
              style={[styles.avatar, { borderColor: colors.accent }]}
            />
            <Pressable style={[styles.editImageButton, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
              <Ionicons name="camera" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text style={[styles.imageHint, { color: colors.textSecondary }]}>Tap to change photo</Text>
        </View>

        {/* Form Section */}
        <View style={[styles.formSection, { backgroundColor: colors.surface }]}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>
              Full Name <Text style={[styles.required, { color: colors.accent }]}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Age */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>
              Age <Text style={[styles.required, { color: colors.accent }]}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="Enter your age"
              placeholderTextColor={colors.textTertiary}
              maxLength={3}
            />
          </View>

          {/* Location */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>
              Location <Text style={[styles.required, { color: colors.accent }]}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter your location"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Bio */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Tell us about yourself..."
              placeholderTextColor={colors.textTertiary}
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.textTertiary }]}>{bio.length}/500</Text>
          </View>

          {/* Additional Fields */}
          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Profession</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              placeholder="What do you do?"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Interests</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              placeholder="Add your hobbies and interests"
              placeholderTextColor={colors.textTertiary}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Pressable
            style={[styles.saveButton, { backgroundColor: colors.accent, shadowColor: colors.accent }, isSaving && [styles.saveButtonDisabled, { backgroundColor: colors.textTertiary }]]}
            onPress={saveProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <Text style={styles.saveText}>Saving...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveText}>Save Changes</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={handleBack}
            disabled={isSaving}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16, // Reduced horizontal padding
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20, // Added border radius to bottom left
    borderBottomRightRadius: 20, // Added border radius to bottom right
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -4, // Shifted further to the left
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 40,
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  imageHint: {
    fontSize: 14,
    fontWeight: "500",
  },
  formSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {},
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  saveButtonDisabled: {
    shadowOpacity: 0,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
