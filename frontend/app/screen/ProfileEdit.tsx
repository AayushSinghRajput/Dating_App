import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getProfile,
  createOrUpdateProfile,
  removePhotoApi,
  setPrimaryPhotoApi,
} from "@/utils/api";

const MAX_PHOTOS = 6;

export default function ProfileEdit() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyPhotoUrl, setBusyPhotoUrl] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [hobbies, setHobbies] = useState("");

  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getProfile();
        setName(profile.name || "");
        setAge(profile.age ? String(profile.age) : "");
        setLocation(profile.location || "");
        setBio(profile.aboutMe || "");
        setProfession(profile.profession || "");
        setHobbies((profile.hobbies || []).join(", "));
        setPhotos((profile as any).photos || []);
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Failed to load profile", text2: error.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPhotoCount = photos.length + newPhotos.length;

  const handleAddPhoto = async () => {
    if (totalPhotoCount >= MAX_PHOTOS) {
      Alert.alert("Limit reached", `You can have up to ${MAX_PHOTOS} photos.`);
      return;
    }
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow photo access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setNewPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemoveExistingPhoto = (url: string) => {
    Alert.alert("Remove Photo", "Remove this photo from your profile?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setBusyPhotoUrl(url);
          try {
            const result = await removePhotoApi(url);
            setPhotos(result.photos);
          } catch (error: any) {
            Toast.show({ type: "error", text1: "Failed to remove photo", text2: error.message });
          } finally {
            setBusyPhotoUrl(null);
          }
        },
      },
    ]);
  };

  const handleSetPrimary = async (url: string) => {
    setBusyPhotoUrl(url);
    try {
      const result = await setPrimaryPhotoApi(url);
      setPhotos(result.photos);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to set main photo", text2: error.message });
    } finally {
      setBusyPhotoUrl(null);
    }
  };

  const handleRemoveNewPhoto = (uri: string) => {
    setNewPhotos((prev) => prev.filter((p) => p !== uri));
  };

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
    try {
      await createOrUpdateProfile({
        name: name.trim(),
        age: Number(age),
        location: location.trim(),
        aboutMe: bio.trim(),
        profession: profession.trim(),
        hobbies: hobbies
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        photos:
          newPhotos.length > 0
            ? newPhotos.map((uri, i) => ({ uri, name: `photo-${i}.jpg`, type: "image/jpeg" }))
            : undefined,
      });
      Toast.show({ type: "success", text1: "Profile updated successfully!" });
      router.back();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to save profile", text2: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );
  }

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
        {/* Photos Section */}
        <View style={[styles.photosSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Photos</Text>
          <Text style={[styles.imageHint, { color: colors.textSecondary, marginBottom: 12 }]}>
            Tap a photo to make it your main photo. Up to {MAX_PHOTOS} photos.
          </Text>
          <View style={styles.photoGrid}>
            {photos.map((url) => (
              <Pressable key={url} style={styles.photoTile} onPress={() => handleSetPrimary(url)}>
                <Image source={{ uri: url }} style={styles.photoTileImage} />
                {photos[0] === url && (
                  <View style={[styles.mainBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
                {busyPhotoUrl === url ? (
                  <View style={styles.photoBusyOverlay}>
                    <ActivityIndicator size="small" color="#fff" />
                  </View>
                ) : (
                  <Pressable
                    style={styles.removePhotoButton}
                    onPress={() => handleRemoveExistingPhoto(url)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={14} color="#fff" />
                  </Pressable>
                )}
              </Pressable>
            ))}
            {newPhotos.map((uri) => (
              <View key={uri} style={styles.photoTile}>
                <Image source={{ uri }} style={styles.photoTileImage} />
                <View style={[styles.newBadge, { backgroundColor: colors.textSecondary }]}>
                  <Text style={styles.mainBadgeText}>New</Text>
                </View>
                <Pressable
                  style={styles.removePhotoButton}
                  onPress={() => handleRemoveNewPhoto(uri)}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </Pressable>
              </View>
            ))}
            {totalPhotoCount < MAX_PHOTOS && (
              <Pressable
                style={[styles.addPhotoTile, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                onPress={handleAddPhoto}
              >
                <Ionicons name="camera" size={24} color={colors.accent} />
              </Pressable>
            )}
          </View>
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
              value={profession}
              onChangeText={setProfession}
              placeholder="What do you do?"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={[styles.label, { color: colors.text }]}>Interests</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border }]}
              value={hobbies}
              onChangeText={setHobbies}
              placeholder="Add your hobbies and interests, comma separated"
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
  center: {
    justifyContent: "center",
    alignItems: "center",
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerPlaceholder: {
    width: 40,
  },
  photosSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  imageHint: {
    fontSize: 13,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoTile: {
    width: 88,
    height: 88,
    borderRadius: 14,
    position: "relative",
  },
  photoTileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  photoBusyOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  mainBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  removePhotoButton: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  addPhotoTile: {
    width: 88,
    height: 88,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
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
