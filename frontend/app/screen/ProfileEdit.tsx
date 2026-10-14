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
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getProfile,
  createOrUpdateProfile,
  removePhotoApi,
  setPrimaryPhotoApi,
} from "@/services/profileService";
import { showActionSheet } from "@/src/components/GlobalActionSheet";
import { PROMPT_QUESTIONS, MAX_PROMPTS, ProfilePrompt } from "@/src/constants/prompts";
import { radius } from "@/src/theme/radius";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_PHOTOS = 6;
const FALLBACK_HERO_IMAGE = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800";

interface DropdownOption {
  value: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const GENDER_OPTIONS: DropdownOption[] = [
  { value: "male", label: "Male", icon: "male-outline" },
  { value: "female", label: "Female", icon: "female-outline" },
  { value: "non-binary", label: "Non-binary", icon: "transgender-outline" },
  { value: "other", label: "Other", icon: "sparkles-outline" },
];

const INTERESTED_IN_OPTIONS: DropdownOption[] = [
  { value: "male", label: "Men", icon: "male-outline" },
  { value: "women", label: "Women", icon: "female-outline" },
  { value: "everyone", label: "Everyone", icon: "people-outline" },
];

const SMOKING_OPTIONS = [
  { value: "no", label: "Non-smoker", icon: "ban-outline" as const },
  { value: "occasionally", label: "Occasionally", icon: "flame-outline" as const },
  { value: "yes", label: "Smoker", icon: "leaf-outline" as const },
];

const DRINKING_OPTIONS = [
  { value: "no", label: "Never", icon: "ban-outline" as const },
  { value: "socially", label: "Socially", icon: "wine-outline" as const },
  { value: "yes", label: "Regularly", icon: "beer-outline" as const },
];

const PETS_OPTIONS = [
  { value: "no pets", label: "No pets", icon: "close-circle-outline" as const },
  { value: "have pets", label: "Have pets", icon: "paw-outline" as const },
  { value: "want pets", label: "Want pets", icon: "heart-outline" as const },
];

const WANTS_CHILDREN_OPTIONS = [
  { value: "no", label: "Don't want", icon: "close-circle-outline" as const },
  { value: "someday", label: "Want someday", icon: "heart-outline" as const },
  { value: "yes", label: "Have kids", icon: "people-outline" as const },
  { value: "not sure", label: "Not sure", icon: "help-circle-outline" as const },
];

const RELATIONSHIP_GOALS_PRESETS = [
  { value: "Long-term relationship", label: "💍 Long-term partner" },
  { value: "Long-term, open to short", label: "🥂 Long-term, open to short" },
  { value: "Short-term fun", label: "✨ Short-term fun" },
  { value: "New friends", label: "☕ New friends" },
  { value: "Still figuring it out", label: "🔍 Still figuring it out" },
];

const POPULAR_INTERESTS = [
  "Coffee", "Travel", "Music", "Fitness", "Movies",
  "Cooking", "Photography", "Art", "Hiking", "Reading",
  "Gaming", "Dogs", "Cats", "Yoga", "Dancing", "Tech"
];

const DEALBREAKER_OPTIONS = [
  { value: "relationshipGoals", label: "Relationship Goals" },
  { value: "smoking", label: "Smoking" },
  { value: "drinking", label: "Drinking" },
  { value: "pets", label: "Pets" },
  { value: "wantsChildren", label: "Wants Children" },
];

export default function ProfileEdit() {
  const router = useRouter();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyPhotoUrl, setBusyPhotoUrl] = useState<string | null>(null);

  // Tabs: 'edit' or 'preview'
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [previewPhotoIndex, setPreviewPhotoIndex] = useState(0);

  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [education, setEducation] = useState("");
  const [relationshipGoals, setRelationshipGoals] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [openDropdown, setOpenDropdown] = useState<"gender" | "interestedIn" | null>(null);
  const [prompts, setPrompts] = useState<ProfilePrompt[]>([]);
  const [minAge, setMinAge] = useState("18");
  const [maxAge, setMaxAge] = useState("99");
  const [dealbreakers, setDealbreakers] = useState<string[]>([]);
  const [smoking, setSmoking] = useState("");
  const [drinking, setDrinking] = useState("");
  const [pets, setPets] = useState("");
  const [wantsChildren, setWantsChildren] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingMe, setLocatingMe] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getProfile();
        setName(profile.name || profile.user?.username || "");
        setAge(profile.age ? String(profile.age) : "");
        setLocation(profile.location || "");
        setBio(profile.aboutMe || "");
        setProfession(profile.profession || "");
        setEducation(profile.education || "");
        setRelationshipGoals(profile.relationshipGoals || "");
        setHobbies((profile.hobbies || []).join(", "));
        setGender(profile.gender || "");
        setInterestedIn(profile.interestedIn || "");
        setPrompts(profile.prompts || []);
        setMinAge(String(profile.preferences?.minAge ?? 18));
        setMaxAge(String(profile.preferences?.maxAge ?? 99));
        setDealbreakers(profile.preferences?.dealbreakers || []);
        setSmoking(profile.lifestyle?.smoking || "");
        setDrinking(profile.lifestyle?.drinking || "");
        setPets(profile.lifestyle?.pets || "");
        setWantsChildren(profile.lifestyle?.wantsChildren || "");
        setMaxDistanceKm(profile.preferences?.maxDistanceKm ? String(profile.preferences.maxDistanceKm) : "");
        const savedCoords = profile.coordinates?.coordinates;
        if (savedCoords?.length === 2) {
          setCoordinates({ lng: savedCoords[0], lat: savedCoords[1] });
        }

        // Reliably load photos: merge profile.photos with profile.profileImage
        const rawPhotos: string[] = Array.isArray((profile as any).photos)
          ? (profile as any).photos.filter((p: any) => typeof p === "string" && p.trim().length > 0)
          : [];
        if (
          profile.profileImage &&
          typeof profile.profileImage === "string" &&
          profile.profileImage.trim().length > 0 &&
          !rawPhotos.includes(profile.profileImage)
        ) {
          rawPhotos.unshift(profile.profileImage);
        }
        setPhotos(rawPhotos);
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Failed to load profile", text2: error.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPhotoCount = photos.length + newPhotos.length;
  const allCurrentPhotos = [...photos, ...newPhotos];

  // Guaranteed photos list for preview (at least one valid hero)
  const displayPhotos = allCurrentPhotos.length > 0 ? allCurrentPhotos : [FALLBACK_HERO_IMAGE];
  const safePhotoIndex =
    previewPhotoIndex >= 0 && previewPhotoIndex < displayPhotos.length ? previewPhotoIndex : 0;

  // Profile completeness score
  const calculateProfileStrength = () => {
    let score = 0;
    if (totalPhotoCount >= 1) score += 25;
    if (totalPhotoCount >= 3) score += 15;
    if (bio.trim().length > 15) score += 15;
    if (name.trim() && age.trim()) score += 10;
    if (location.trim()) score += 10;
    if (gender && interestedIn) score += 10;
    if (profession.trim() || education.trim()) score += 5;
    if (prompts.some((p) => p.answer.trim().length > 0)) score += 10;
    return Math.min(100, score);
  };

  const profileStrength = calculateProfileStrength();

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
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setNewPhotos((prev) => [...prev, result.assets[0].uri]);
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Couldn't open photo picker",
        text2: "Your device or emulator doesn't have a photo picker app installed.",
      });
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
    if (photos[0] === url) return;
    setBusyPhotoUrl(url);
    try {
      const result = await setPrimaryPhotoApi(url);
      setPhotos(result.photos);
      Toast.show({ type: "success", text1: "Main photo updated!" });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Failed to set main photo", text2: error.message });
    } finally {
      setBusyPhotoUrl(null);
    }
  };

  const handleRemoveNewPhoto = (uri: string) => {
    setNewPhotos((prev) => prev.filter((p) => p !== uri));
  };

  const toggleDealbreaker = (key: string) => {
    setDealbreakers((prev) => (prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]));
  };

  const handleToggleInterest = (interest: string) => {
    const currentList = hobbies
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    const exists = currentList.some((item) => item.toLowerCase() === interest.toLowerCase());
    const updated = exists
      ? currentList.filter((item) => item.toLowerCase() !== interest.toLowerCase())
      : [...currentList, interest];
    setHobbies(updated.join(", "));
  };

  const handleUpdateLocation = async () => {
    setLocatingMe(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Denied", "Location access is needed to enable distance-based matching.");
        return;
      }

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          "Location Services Off",
          "Turn on Location in your device settings, then try again."
        );
        return;
      }

      let position;
      let freshFixError: any = null;
      try {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch (err) {
        freshFixError = err;
        console.warn("getCurrentPositionAsync failed, falling back to last known position:", err);
        position = await Location.getLastKnownPositionAsync({});
      }

      if (!position) {
        throw new Error(
          freshFixError?.message
            ? `No location fix available: ${freshFixError.message}`
            : "No location fix available yet. On an emulator, set a mock location in Extended Controls."
        );
      }

      setCoordinates({ lat: position.coords.latitude, lng: position.coords.longitude });
      Toast.show({ type: "success", text1: "Location updated successfully" });
    } catch (error: any) {
      console.error("handleUpdateLocation failed:", error);
      Toast.show({ type: "error", text1: "Couldn't get your location", text2: error.message });
    } finally {
      setLocatingMe(false);
    }
  };

  const handleAddPrompt = () => {
    const usedQuestions = new Set(prompts.map((p) => p.question));
    const available = PROMPT_QUESTIONS.filter((q) => !usedQuestions.has(q));
    if (available.length === 0) return;

    showActionSheet({
      title: "Choose a prompt",
      options: available.map((question) => ({
        label: question,
        onPress: () => setPrompts((prev) => [...prev, { question, answer: "" }]),
      })),
    });
  };

  const handleRemovePrompt = (question: string) => {
    setPrompts((prev) => prev.filter((p) => p.question !== question));
  };

  const handlePromptAnswerChange = (question: string, answer: string) => {
    setPrompts((prev) => prev.map((p) => (p.question === question ? { ...p, answer } : p)));
  };

  const saveProfile = async () => {
    if (!name.trim() || !age.trim() || !location.trim()) {
      Alert.alert("Required Information", "Please provide your Full Name, Age, and Location.");
      return;
    }

    if (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 100) {
      Alert.alert("Invalid Age", "Please enter a valid age between 18 and 100.");
      return;
    }

    const minAgeNum = Number(minAge);
    const maxAgeNum = Number(maxAge);
    if (
      isNaN(minAgeNum) || isNaN(maxAgeNum) ||
      minAgeNum < 18 || maxAgeNum < 18 || minAgeNum > maxAgeNum
    ) {
      Alert.alert("Age Range Preference", "Please enter a valid age preference range (18+, min ≤ max).");
      return;
    }

    if (maxDistanceKm.trim() && (isNaN(Number(maxDistanceKm)) || Number(maxDistanceKm) < 1)) {
      Alert.alert("Invalid Distance", "Please enter a valid maximum distance in km, or leave blank for unlimited.");
      return;
    }

    const filledPrompts = prompts.filter((p) => p.answer.trim().length > 0);

    setIsSaving(true);
    try {
      await createOrUpdateProfile({
        name: name.trim(),
        age: Number(age),
        location: location.trim(),
        aboutMe: bio.trim(),
        profession: profession.trim(),
        education: education.trim(),
        relationshipGoals: relationshipGoals.trim(),
        gender: gender || undefined,
        interestedIn: interestedIn || undefined,
        hobbies: hobbies
          .split(",")
          .map((h) => h.trim())
          .filter(Boolean),
        prompts: filledPrompts.map((p) => ({ question: p.question, answer: p.answer.trim() })),
        preferences: {
          minAge: minAgeNum,
          maxAge: maxAgeNum,
          dealbreakers,
          maxDistanceKm: maxDistanceKm.trim() ? Number(maxDistanceKm) : null,
        },
        lifestyle: {
          smoking: smoking || undefined,
          drinking: drinking || undefined,
          pets: pets || undefined,
          wantsChildren: wantsChildren || undefined,
        },
        coordinates: coordinates ? ({ lng: coordinates.lng, lat: coordinates.lat } as any) : undefined,
        photos:
          newPhotos.length > 0
            ? newPhotos.map((uri, i) => ({ uri, name: `photo-${i}.jpg`, type: "image/jpeg" }))
            : undefined,
      });
      Toast.show({ type: "success", text1: "Profile saved successfully!" });
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

  // Selected hobbies list as array
  const currentHobbiesList = hobbies
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Tinder / Bumble Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <Pressable style={styles.headerButton} onPress={handleBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <Pressable
          style={[styles.saveHeaderButton, { backgroundColor: colors.accent }]}
          onPress={saveProfile}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveHeaderButtonText}>Done</Text>
          )}
        </Pressable>
      </View>

      {/* Segmented Tab Switcher (Edit vs Preview) */}
      <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          style={[
            styles.tabButton,
            activeTab === "edit" && [styles.activeTabButton, { borderBottomColor: colors.accent }],
          ]}
          onPress={() => setActiveTab("edit")}
        >
          <Ionicons
            name="create-outline"
            size={18}
            color={activeTab === "edit" ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "edit" ? colors.accent : colors.textSecondary },
              activeTab === "edit" && styles.activeTabText,
            ]}
          >
            Edit Profile
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,
            activeTab === "preview" && [styles.activeTabButton, { borderBottomColor: colors.accent }],
          ]}
          onPress={() => {
            setActiveTab("preview");
            setPreviewPhotoIndex(0);
          }}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color={activeTab === "preview" ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === "preview" ? colors.accent : colors.textSecondary },
              activeTab === "preview" && styles.activeTabText,
            ]}
          >
            Preview Profile
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: EDIT MODE */}
      {activeTab === "edit" ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Bumble-Style Profile Strength Meter */}
          <View style={[styles.strengthCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.strengthHeader}>
              <View style={styles.strengthTitleRow}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text style={[styles.strengthTitle, { color: colors.text }]}>Profile Strength</Text>
              </View>
              <Text style={[styles.strengthPercentage, { color: colors.accent }]}>
                {profileStrength}%
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={[styles.strengthProgressBarTrack, { backgroundColor: colors.surfaceAlt }]}>
              <View
                style={[
                  styles.strengthProgressBarFill,
                  { width: `${profileStrength}%`, backgroundColor: colors.accent },
                ]}
              />
            </View>

            <Text style={[styles.strengthHint, { color: colors.textSecondary }]}>
              {profileStrength < 50
                ? "Add at least 3 photos & a bio to boost your match rate!"
                : profileStrength < 80
                ? "Complete your lifestyle badges & prompts for maximum visibility!"
                : "🔥 Outstanding! Your profile is primed for high compatibility matches."}
            </Text>
          </View>

          {/* Photos Section (Tinder / Bumble 6-Tile Grid) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border, overflow: "hidden" }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <Text style={[styles.sectionHeading, { color: colors.text }]}>Media & Photos</Text>
                  <View style={[styles.photoCounterBadge, { backgroundColor: colors.accentSoft }]}>
                    <Text style={[styles.photoCounterText, { color: colors.accent }]}>
                      {totalPhotoCount}/{MAX_PHOTOS}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
                  Tap to set your primary cover photo. Up to {MAX_PHOTOS} photos.
                </Text>
              </View>
            </View>

            {/* 3x2 Grid Slots */}
            <View style={styles.photoGrid}>
              {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
                const photoUrl = allCurrentPhotos[slotIndex];
                const isNew = slotIndex >= photos.length && photoUrl !== undefined;
                const isPrimary = slotIndex === 0 && photoUrl !== undefined;

                if (photoUrl) {
                  return (
                    <View key={`slot-${slotIndex}`} style={styles.photoSlot}>
                      <Pressable
                        style={styles.photoImageContainer}
                        onPress={() => !isNew && handleSetPrimary(photoUrl)}
                      >
                        <Image
                          source={{ uri: photoUrl }}
                          style={styles.photoImage}
                          contentFit="cover"
                          transition={200}
                        />

                        {/* Slot Number */}
                        <View style={styles.slotNumberBadge}>
                          <Text style={styles.slotNumberText}>{slotIndex + 1}</Text>
                        </View>

                        {/* Main Cover Badge */}
                        {isPrimary && (
                          <LinearGradient
                            colors={["rgba(230,57,70,0.9)", "rgba(255,107,107,0.95)"]}
                            style={styles.coverBadge}
                          >
                            <Ionicons name="star" size={10} color="#fff" style={{ marginRight: 3 }} />
                            <Text style={styles.coverBadgeText}>Main</Text>
                          </LinearGradient>
                        )}

                        {/* New Badge */}
                        {isNew && (
                          <View style={[styles.newBadge, { backgroundColor: colors.info }]}>
                            <Text style={styles.newBadgeText}>New</Text>
                          </View>
                        )}

                        {/* Busy Overlay */}
                        {busyPhotoUrl === photoUrl && (
                          <View style={styles.photoBusyOverlay}>
                            <ActivityIndicator size="small" color="#fff" />
                          </View>
                        )}

                        {/* Remove Button */}
                        <Pressable
                          style={styles.deletePhotoButton}
                          onPress={() =>
                            isNew ? handleRemoveNewPhoto(photoUrl) : handleRemoveExistingPhoto(photoUrl)
                          }
                          hitSlop={8}
                        >
                          <Ionicons name="close" size={14} color="#fff" />
                        </Pressable>
                      </Pressable>
                    </View>
                  );
                }

                // Empty Slot
                return (
                  <View key={`empty-${slotIndex}`} style={styles.photoSlot}>
                    <Pressable
                      style={[
                        styles.emptyPhotoSlot,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      ]}
                      onPress={handleAddPhoto}
                    >
                      <View style={styles.slotNumberBadge}>
                        <Text style={[styles.slotNumberText, { color: colors.textTertiary }]}>
                          {slotIndex + 1}
                        </Text>
                      </View>
                      <View style={[styles.addIconCircle, { backgroundColor: colors.accentSoft }]}>
                        <Ionicons name="add" size={22} color={colors.accent} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* Photo Tip Pill */}
            <View style={[styles.tipBanner, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="camera-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.tipBannerText, { color: colors.accent }]}>
                Tip: Smiles, candid portraits, and outdoor photos receive 3x more likes!
              </Text>
            </View>
          </View>

          {/* Section: About Me (Bio) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconTitleRow}>
                <Ionicons name="sparkles-outline" size={20} color={colors.accent} />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>About Me</Text>
              </View>
              <Text style={[styles.charCountText, { color: colors.textTertiary }]}>
                {bio.length}/500
              </Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 10 }]}>
              A short description of yourself, passions, or a witty hook.
            </Text>

            <TextInput
              style={[
                styles.bioTextArea,
                { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
              ]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
              placeholder="Tell suitors what makes you tick, favorite weekend routine..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Section: The Basics (Hinge / Bumble Style) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconTitleRow}>
              <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
              <Text style={[styles.sectionHeading, { color: colors.text }]}>The Basics</Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 16 }]}>
              Core details displayed on your card.
            </Text>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>
                Full Name <Text style={{ color: colors.accent }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Age & Location in Dual Row */}
            <View style={styles.dualRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Age <Text style={{ color: colors.accent }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                  maxLength={3}
                  placeholder="24"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 2 }]}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>
                  Location <Text style={{ color: colors.accent }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Kathmandu, Nepal"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>

            {/* GPS Location Button */}
            <Pressable
              style={[
                styles.gpsLocationButton,
                { backgroundColor: colors.surfaceAlt, borderColor: coordinates ? colors.success : colors.border },
              ]}
              onPress={handleUpdateLocation}
              disabled={locatingMe}
            >
              {locatingMe ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Ionicons
                  name={coordinates ? "location" : "location-outline"}
                  size={18}
                  color={coordinates ? colors.success : colors.accent}
                />
              )}
              <Text style={[styles.gpsButtonText, { color: colors.text }]}>
                {locatingMe
                  ? "Detecting location..."
                  : coordinates
                  ? "Location coordinates synced ✓"
                  : "Sync GPS coordinates for discovery"}
              </Text>
            </Pressable>

            {/* Gender Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Gender</Text>
              <Pressable
                style={[
                  styles.dropdownTrigger,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: openDropdown === "gender" ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => setOpenDropdown((prev) => (prev === "gender" ? null : "gender"))}
              >
                <View style={styles.dropdownValueRow}>
                  {gender ? (
                    <>
                      <Ionicons
                        name={GENDER_OPTIONS.find((opt) => opt.value === gender)?.icon || "person-outline"}
                        size={18}
                        color={colors.accent}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.dropdownValueText, { color: colors.text }]}>
                        {GENDER_OPTIONS.find((opt) => opt.value === gender)?.label || gender}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.dropdownValueText, { color: colors.textTertiary }]}>
                      Select your gender
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={openDropdown === "gender" ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={openDropdown === "gender" ? colors.accent : colors.textTertiary}
                />
              </Pressable>

              {openDropdown === "gender" && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                  ]}
                >
                  {GENDER_OPTIONS.map((option, index) => {
                    const isSelected = gender === option.value;
                    const isLast = index === GENDER_OPTIONS.length - 1;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.dropdownOption,
                          isSelected && { backgroundColor: colors.accentSoft },
                          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                        ]}
                        onPress={() => {
                          setGender(isSelected ? "" : option.value);
                          setOpenDropdown(null);
                        }}
                      >
                        <View style={styles.dropdownOptionLeft}>
                          <Ionicons
                            name={option.icon}
                            size={18}
                            color={isSelected ? colors.accent : colors.textSecondary}
                            style={{ marginRight: 10 }}
                          />
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              {
                                color: isSelected ? colors.accent : colors.text,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Interested In Dropdown */}
            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Interested In</Text>
              <Pressable
                style={[
                  styles.dropdownTrigger,
                  {
                    backgroundColor: colors.surfaceAlt,
                    borderColor: openDropdown === "interestedIn" ? colors.accent : colors.border,
                  },
                ]}
                onPress={() =>
                  setOpenDropdown((prev) => (prev === "interestedIn" ? null : "interestedIn"))
                }
              >
                <View style={styles.dropdownValueRow}>
                  {interestedIn ? (
                    <>
                      <Ionicons
                        name={
                          INTERESTED_IN_OPTIONS.find((opt) => opt.value === interestedIn)?.icon ||
                          "people-outline"
                        }
                        size={18}
                        color={colors.accent}
                        style={{ marginRight: 10 }}
                      />
                      <Text style={[styles.dropdownValueText, { color: colors.text }]}>
                        {INTERESTED_IN_OPTIONS.find((opt) => opt.value === interestedIn)?.label ||
                          interestedIn}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.dropdownValueText, { color: colors.textTertiary }]}>
                      Select who you&apos;re interested in
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={openDropdown === "interestedIn" ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={openDropdown === "interestedIn" ? colors.accent : colors.textTertiary}
                />
              </Pressable>

              {openDropdown === "interestedIn" && (
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow },
                  ]}
                >
                  {INTERESTED_IN_OPTIONS.map((option, index) => {
                    const isSelected = interestedIn === option.value;
                    const isLast = index === INTERESTED_IN_OPTIONS.length - 1;
                    return (
                      <Pressable
                        key={option.value}
                        style={[
                          styles.dropdownOption,
                          isSelected && { backgroundColor: colors.accentSoft },
                          !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                        ]}
                        onPress={() => {
                          setInterestedIn(isSelected ? "" : option.value);
                          setOpenDropdown(null);
                        }}
                      >
                        <View style={styles.dropdownOptionLeft}>
                          <Ionicons
                            name={option.icon}
                            size={18}
                            color={isSelected ? colors.accent : colors.textSecondary}
                            style={{ marginRight: 10 }}
                          />
                          <Text
                            style={[
                              styles.dropdownOptionText,
                              {
                                color: isSelected ? colors.accent : colors.text,
                                fontWeight: isSelected ? "700" : "500",
                              },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Profession / Work */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="briefcase-outline" size={16} color={colors.accent} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Profession / Work</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
                value={profession}
                onChangeText={setProfession}
                placeholder="Software Engineer, Designer, Doctor..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Education */}
            <View style={styles.inputGroup}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="school-outline" size={16} color={colors.accent} />
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Education / University</Text>
              </View>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
                value={education}
                onChangeText={setEducation}
                placeholder="Tribhuvan University, Kathmandu..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          {/* Section: Relationship Goals (Hinge Style) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconTitleRow}>
              <Ionicons name="heart-outline" size={22} color={colors.accent} />
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Relationship Intent</Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 12 }]}>
              What are you hoping to find on Soulmate?
            </Text>

            <View style={styles.pillWrap}>
              {RELATIONSHIP_GOALS_PRESETS.map((preset) => {
                const isSelected = relationshipGoals === preset.value;
                return (
                  <Pressable
                    key={preset.value}
                    style={[
                      styles.choicePill,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => setRelationshipGoals(isSelected ? "" : preset.value)}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        { color: isSelected ? "#fff" : colors.text },
                        isSelected && { fontWeight: "700" },
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Input */}
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.text,
                  borderColor: colors.border,
                  marginTop: 8,
                },
              ]}
              value={relationshipGoals}
              onChangeText={setRelationshipGoals}
              placeholder="Or type custom relationship intent..."
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Section: Hinge-Style Profile Prompts */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconTitleRow}>
                <Ionicons name="chatbubbles-outline" size={22} color={colors.accent} />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>Profile Prompts</Text>
              </View>
              <Text style={[styles.photoCounterText, { color: colors.accent }]}>
                {prompts.length}/{MAX_PROMPTS}
              </Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 14 }]}>
              Answers to prompts give matches an easy opening line to reach out.
            </Text>

            {prompts.map((prompt) => (
              <View
                key={prompt.question}
                style={[styles.hingePromptCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
              >
                <View style={styles.promptHeaderBar}>
                  <View style={styles.promptTag}>
                    <Text style={styles.promptTagText}>Prompt</Text>
                  </View>
                  <Pressable onPress={() => handleRemovePrompt(prompt.question)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                  </Pressable>
                </View>

                <Text style={[styles.promptQuestionTitle, { color: colors.text }]}>
                  {prompt.question}
                </Text>

                <TextInput
                  style={[
                    styles.promptTextInput,
                    { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                  ]}
                  value={prompt.answer}
                  onChangeText={(text) => handlePromptAnswerChange(prompt.question, text)}
                  placeholder="Type your authentic answer here..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={300}
                />
              </View>
            ))}

            {prompts.length < MAX_PROMPTS && (
              <Pressable
                style={[
                  styles.addPromptCardButton,
                  { borderColor: colors.accent, backgroundColor: colors.accentSoft },
                ]}
                onPress={handleAddPrompt}
              >
                <Ionicons name="add-circle" size={22} color={colors.accent} />
                <Text style={[styles.addPromptCardText, { color: colors.accent }]}>
                  Select a Prompt ({prompts.length}/{MAX_PROMPTS})
                </Text>
              </Pressable>
            )}
          </View>

          {/* Section: Lifestyle & Habits (Bumble Style) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconTitleRow}>
              <Ionicons name="wine-outline" size={22} color={colors.accent} />
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Lifestyle & Habits</Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 14 }]}>
              Share a little about how you spend your time.
            </Text>

            {/* Smoking */}
            <View style={styles.lifestyleRowItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Smoking</Text>
              <View style={styles.pillWrap}>
                {SMOKING_OPTIONS.map((opt) => {
                  const isSelected = smoking === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.lifestylePill,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setSmoking(isSelected ? "" : opt.value)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={isSelected ? "#fff" : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.choicePillText, { color: isSelected ? "#fff" : colors.text }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Drinking */}
            <View style={styles.lifestyleRowItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Drinking</Text>
              <View style={styles.pillWrap}>
                {DRINKING_OPTIONS.map((opt) => {
                  const isSelected = drinking === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.lifestylePill,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setDrinking(isSelected ? "" : opt.value)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={isSelected ? "#fff" : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.choicePillText, { color: isSelected ? "#fff" : colors.text }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Pets */}
            <View style={styles.lifestyleRowItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Pets</Text>
              <View style={styles.pillWrap}>
                {PETS_OPTIONS.map((opt) => {
                  const isSelected = pets === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.lifestylePill,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setPets(isSelected ? "" : opt.value)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={isSelected ? "#fff" : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.choicePillText, { color: isSelected ? "#fff" : colors.text }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Wants Children */}
            <View style={styles.lifestyleRowItem}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Kids & Family</Text>
              <View style={styles.pillWrap}>
                {WANTS_CHILDREN_OPTIONS.map((opt) => {
                  const isSelected = wantsChildren === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      style={[
                        styles.lifestylePill,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => setWantsChildren(isSelected ? "" : opt.value)}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={isSelected ? "#fff" : colors.textSecondary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.choicePillText, { color: isSelected ? "#fff" : colors.text }]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Section: Passions & Interests (Tinder Style) */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconTitleRow}>
              <Ionicons name="flame-outline" size={22} color={colors.accent} />
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Passions & Interests</Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 12 }]}>
              Tap to add popular tags or type your own below.
            </Text>

            {/* Popular preset tags */}
            <View style={styles.pillWrap}>
              {POPULAR_INTERESTS.map((interest) => {
                const isSelected = currentHobbiesList.some(
                  (h) => h.toLowerCase() === interest.toLowerCase()
                );
                return (
                  <Pressable
                    key={interest}
                    style={[
                      styles.choicePill,
                      { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => handleToggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.choicePillText,
                        { color: isSelected ? "#fff" : colors.text },
                        isSelected && { fontWeight: "700" },
                      ]}
                    >
                      {isSelected ? `✓ ${interest}` : `+ ${interest}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Manual text input */}
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surfaceAlt,
                  color: colors.text,
                  borderColor: colors.border,
                  marginTop: 12,
                },
              ]}
              value={hobbies}
              onChangeText={setHobbies}
              placeholder="e.g. Anime, Coding, Guitar, Board games (comma-separated)"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Section: Discovery & Matching Preferences */}
          <View style={[styles.cardSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.iconTitleRow}>
              <Ionicons name="options-outline" size={22} color={colors.accent} />
              <Text style={[styles.sectionHeading, { color: colors.text }]}>Discovery Preferences</Text>
            </View>
            <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 14 }]}>
              Adjust your search radius and compatibility dealbreakers.
            </Text>

            <View style={styles.dualRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Min Age</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: colors.text }]}>Max Age</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                  ]}
                  value={maxAge}
                  onChangeText={setMaxAge}
                  keyboardType="numeric"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Max Distance (km)</Text>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceAlt, color: colors.text, borderColor: colors.border },
                ]}
                value={maxDistanceKm}
                onChangeText={setMaxDistanceKm}
                keyboardType="numeric"
                maxLength={4}
                placeholder="Unlimited / No limit"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Dealbreakers */}
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 6 }]}>
                Strict Dealbreakers
              </Text>
              <Text style={[styles.sectionSubheading, { color: colors.textSecondary, marginBottom: 10 }]}>
                Profiles must match these criteria to appear in your discovery.
              </Text>
              <View style={styles.pillWrap}>
                {DEALBREAKER_OPTIONS.map((option) => {
                  const isActive = dealbreakers.includes(option.value);
                  return (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.choicePill,
                        { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                        isActive && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                      onPress={() => toggleDealbreaker(option.value)}
                    >
                      <Text
                        style={[
                          styles.choicePillText,
                          { color: isActive ? "#fff" : colors.text },
                          isActive && { fontWeight: "700" },
                        ]}
                      >
                        {isActive ? `🔒 ${option.label}` : option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSectionContainer}>
            <Pressable
              style={[
                styles.primarySaveButton,
                { backgroundColor: colors.accent, shadowColor: colors.accent },
                isSaving && { opacity: 0.7 },
              ]}
              onPress={saveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.primarySaveButtonText}>Save Profile Changes</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={[styles.secondaryCancelButton, { borderColor: colors.border }]}
              onPress={handleBack}
              disabled={isSaving}
            >
              <Text style={[styles.secondaryCancelButtonText, { color: colors.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        /* TAB 2: LIVE PREVIEW MODE (Tinder / Hinge Profile Card) */
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.previewScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Photo Card */}
          <View style={[styles.previewPhotoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.previewImageWrapper}>
              <Image
                source={{ uri: displayPhotos[safePhotoIndex] }}
                style={styles.previewImage}
                contentFit="cover"
                transition={200}
                cachePolicy="disk"
              />

              {/* Sample indicator if no custom photo uploaded */}
              {allCurrentPhotos.length === 0 && (
                <View style={styles.sampleBadgePill}>
                  <Text style={styles.sampleBadgePillText}>Sample Photo Preview</Text>
                </View>
              )}

              {/* Top Dash Story Indicator */}
              {displayPhotos.length > 1 && (
                <View style={styles.previewDashContainer}>
                  {displayPhotos.map((_, idx) => (
                    <View
                      key={`dash-${idx}`}
                      style={[
                        styles.previewDash,
                        {
                          backgroundColor:
                            idx === safePhotoIndex ? "#fff" : "rgba(255,255,255,0.4)",
                        },
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Left/Right Tap Area to Cycle Photos */}
              {displayPhotos.length > 1 && (
                <View style={styles.previewTapOverlay}>
                  <Pressable
                    style={styles.previewTapSide}
                    onPress={() =>
                      setPreviewPhotoIndex((prev) =>
                        prev > 0 ? prev - 1 : displayPhotos.length - 1
                      )
                    }
                  />
                  <Pressable
                    style={styles.previewTapSide}
                    onPress={() =>
                      setPreviewPhotoIndex((prev) =>
                        prev < displayPhotos.length - 1 ? prev + 1 : 0
                      )
                    }
                  />
                </View>
              )}

              {/* Gradient Vignette over Photo */}
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
                style={styles.previewPhotoGradient}
              >
                <View style={styles.previewNameAgeRow}>
                  <Text style={styles.previewHeroName}>{name || "Your Name"}</Text>
                  <Text style={styles.previewHeroAge}>{age ? `, ${age}` : ""}</Text>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#38bdf8"
                    style={{ marginLeft: 6 }}
                  />
                </View>

                {/* Location badge */}
                <View style={styles.previewLocationRow}>
                  <Ionicons name="location" size={15} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.previewLocationText}>
                    {location || "Location not set"}
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Core Info Badges */}
            <View style={styles.previewBadgesRow}>
              {profession ? (
                <View style={[styles.previewInfoBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name="briefcase-outline" size={15} color={colors.accent} />
                  <Text style={[styles.previewInfoBadgeText, { color: colors.text }]}>
                    {profession}
                  </Text>
                </View>
              ) : null}

              {education ? (
                <View style={[styles.previewInfoBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name="school-outline" size={15} color={colors.accent} />
                  <Text style={[styles.previewInfoBadgeText, { color: colors.text }]}>
                    {education}
                  </Text>
                </View>
              ) : null}

              {gender ? (
                <View style={[styles.previewInfoBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons
                    name={GENDER_OPTIONS.find((g) => g.value === gender)?.icon || "person-outline"}
                    size={15}
                    color={colors.accent}
                  />
                  <Text style={[styles.previewInfoBadgeText, { color: colors.text }]}>
                    {GENDER_OPTIONS.find((g) => g.value === gender)?.label || gender}
                  </Text>
                </View>
              ) : null}

              {relationshipGoals ? (
                <View style={[styles.previewInfoBadge, { backgroundColor: colors.surfaceAlt }]}>
                  <Ionicons name="heart" size={15} color={colors.accent} />
                  <Text style={[styles.previewInfoBadgeText, { color: colors.text }]}>
                    {relationshipGoals}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Bio Card */}
            <View style={[styles.previewBioBlock, { borderTopColor: colors.border }]}>
              <Text style={[styles.previewSectionTitle, { color: colors.textSecondary }]}>
                About Me
              </Text>
              <Text style={[styles.previewBioText, { color: colors.text }]}>
                {bio.trim() || "No bio added yet. Add a short bio to introduce yourself."}
              </Text>
            </View>

            {/* Answered Hinge Prompts */}
            {prompts.filter((p) => p.answer.trim().length > 0).map((prompt, i) => (
              <View
                key={`preview-prompt-${i}`}
                style={[
                  styles.previewPromptBubble,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.previewPromptQuestion, { color: colors.accent }]}>
                  {prompt.question}
                </Text>
                <Text style={[styles.previewPromptAnswer, { color: colors.text }]}>
                  &ldquo;{prompt.answer}&rdquo;
                </Text>
              </View>
            ))}

            {/* Lifestyle Badges */}
            {(smoking || drinking || pets || wantsChildren) ? (
              <View style={[styles.previewBioBlock, { borderTopColor: colors.border }]}>
                <Text style={[styles.previewSectionTitle, { color: colors.textSecondary }]}>
                  Lifestyle & Habits
                </Text>
                <View style={styles.pillWrap}>
                  {smoking ? (
                    <View style={[styles.previewMiniPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="leaf-outline" size={14} color={colors.accent} />
                      <Text style={[styles.previewMiniPillText, { color: colors.text }]}>
                        Smoking: {smoking}
                      </Text>
                    </View>
                  ) : null}
                  {drinking ? (
                    <View style={[styles.previewMiniPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="wine-outline" size={14} color={colors.accent} />
                      <Text style={[styles.previewMiniPillText, { color: colors.text }]}>
                        Drinking: {drinking}
                      </Text>
                    </View>
                  ) : null}
                  {pets ? (
                    <View style={[styles.previewMiniPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="paw-outline" size={14} color={colors.accent} />
                      <Text style={[styles.previewMiniPillText, { color: colors.text }]}>
                        {pets}
                      </Text>
                    </View>
                  ) : null}
                  {wantsChildren ? (
                    <View style={[styles.previewMiniPill, { backgroundColor: colors.surfaceAlt }]}>
                      <Ionicons name="people-outline" size={14} color={colors.accent} />
                      <Text style={[styles.previewMiniPillText, { color: colors.text }]}>
                        Kids: {wantsChildren}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Passions & Interests */}
            {currentHobbiesList.length > 0 ? (
              <View style={[styles.previewBioBlock, { borderTopColor: colors.border }]}>
                <Text style={[styles.previewSectionTitle, { color: colors.textSecondary }]}>
                  Passions & Interests
                </Text>
                <View style={styles.pillWrap}>
                  {currentHobbiesList.map((hobby, index) => (
                    <View
                      key={`preview-hobby-${index}`}
                      style={[styles.previewMiniPill, { backgroundColor: colors.accentSoft }]}
                    >
                      <Text style={[styles.previewMiniPillText, { color: colors.accent, fontWeight: "600" }]}>
                        {hobby}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>

          {/* Return to Edit Bar */}
          <View style={styles.actionSectionContainer}>
            <Pressable
              style={[styles.primarySaveButton, { backgroundColor: colors.accent }]}
              onPress={() => setActiveTab("edit")}
            >
              <Ionicons name="create-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primarySaveButtonText}>Return to Edit Profile</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  saveHeaderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  saveHeaderButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  /* Segmented Tab Switcher */
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTabButton: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "700",
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  /* Profile Strength */
  strengthCard: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  strengthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  strengthTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  strengthTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  strengthPercentage: {
    fontSize: 15,
    fontWeight: "800",
  },
  strengthProgressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  strengthProgressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  strengthHint: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },

  /* Grouped Card Sections */
  cardSection: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sectionSubheading: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  photoCounterBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  photoCounterText: {
    fontSize: 12,
    fontWeight: "700",
  },

  /* 3x2 Photo Grid */
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 4,
  },
  photoSlot: {
    width: "31%",
    aspectRatio: 0.78,
    marginBottom: 12,
  },
  photoImageContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  slotNumberBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  slotNumberText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  coverBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  newBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  photoBusyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  deletePhotoButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  emptyPhotoSlot: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  addIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  tipBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  tipBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  /* Bio */
  charCountText: {
    fontSize: 12,
    fontWeight: "500",
  },
  bioTextArea: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    borderWidth: 1,
  },

  /* Inputs & Form Groups */
  inputGroup: {
    marginBottom: 16,
  },
  dualRow: {
    flexDirection: "row",
    gap: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  labelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  gpsLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  gpsButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },

  /* Dropdown Trigger & Menu */
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
  },
  dropdownValueRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownValueText: {
    fontSize: 15,
    fontWeight: "500",
  },
  dropdownMenu: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dropdownOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  dropdownOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dropdownOptionText: {
    fontSize: 14,
  },

  /* Pills & Badges */
  pillWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choicePill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  choicePillText: {
    fontSize: 13,
    fontWeight: "600",
  },
  lifestyleRowItem: {
    marginBottom: 14,
  },
  lifestylePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },

  /* Hinge-style Prompts */
  hingePromptCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  promptHeaderBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  promptTag: {
    backgroundColor: "rgba(230,57,70,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  promptTagText: {
    color: "#e63946",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  promptQuestionTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 10,
  },
  promptTextInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 64,
    textAlignVertical: "top",
  },
  addPromptCardButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addPromptCardText: {
    fontSize: 14,
    fontWeight: "700",
  },

  /* Bottom Actions */
  actionSectionContainer: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
    gap: 12,
  },
  primarySaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primarySaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },

  /* TAB 2: LIVE PREVIEW STYLES */
  previewScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  previewPhotoCard: {
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  previewImageWrapper: {
    width: "100%",
    height: SCREEN_WIDTH ? SCREEN_WIDTH * 1.25 : 460,
    position: "relative",
    backgroundColor: "#1a1a1a",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  sampleBadgePill: {
    position: "absolute",
    top: 14,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    zIndex: 20,
  },
  sampleBadgePillText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  previewDashContainer: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  previewDash: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  previewTapOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 5,
  },
  previewTapSide: {
    flex: 1,
    height: "100%",
  },
  previewPhotoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 60,
  },
  previewNameAgeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  previewHeroName: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  previewHeroAge: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "500",
  },
  previewLocationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewLocationText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "500",
  },

  /* Preview info content */
  previewBadgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
  },
  previewInfoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  previewInfoBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  previewBioBlock: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  previewSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  previewBioText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400",
  },
  previewPromptBubble: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  previewPromptQuestion: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  previewPromptAnswer: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  previewMiniPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  previewMiniPillText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
