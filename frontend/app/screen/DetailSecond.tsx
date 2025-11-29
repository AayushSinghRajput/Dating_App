import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { createOrUpdateProfile, Profile } from "@/utils/api";
import Toast from "react-native-toast-message";

const { height } = Dimensions.get("window");

export default function DetailSecond() {
  const { name, age, gender, interestedIn, profilePic } =
    useLocalSearchParams();
  const router = useRouter();
  const [hobbies, setHobbies] = useState("");
  const [goal, setGoal] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const goalOptions = [
    {
      label: "Long-term relationship",
      icon: "heart",
      value: "Long-term relationship",
    },
    { label: "Marriage", icon: "diamond", value: "Marriage" },
    { label: "Dating", icon: "calendar", value: "Dating" },
    { label: "Friendship", icon: "people", value: "Friendship" },
    { label: "Not sure yet", icon: "help-circle", value: "Not sure yet" },
  ];

  const locationOptions = [
    { label: "Kathmandu", icon: "location", value: "Kathmandu" },
    { label: "Pokhara", icon: "location", value: "Pokhara" },
    { label: "Lalitpur", icon: "location", value: "Lalitpur" },
    { label: "Bhaktapur", icon: "location", value: "Bhaktapur" },
    { label: "Chitwan", icon: "location", value: "Chitwan" },
    { label: "Butwal", icon: "location", value: "Butwal" },
    { label: "Biratnagar", icon: "location", value: "Biratnagar" },
    { label: "Dharan", icon: "location", value: "Dharan" },
    { label: "Other", icon: "globe", value: "Other" },
  ];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleFinish = async () => {
    if (!hobbies.trim() || !bio.trim() || !goal || !location) {
      Toast.show({
        type: "error",
        text1: "Incomplete Fields",
        text2: "Please complete all fields before continuing",
      });
      return;
    }

    try {
      // Map frontend values to backend enums
      const genderMap: Record<string, string> = {
        Male: "male",
        Female: "female",
        "Non-binary": "non-binary",
        Other: "other",
      };

      const interestedMap: Record<string, string> = {
        Men: "male",
        Women: "women",
        Everyone: "everyone",
      };

      // Prepare profile data
      const profileData: Profile = {
        name: Array.isArray(name) ? name[0] : String(name),
        location,
        aboutMe: bio,
        gender:
          genderMap[Array.isArray(gender) ? gender[0] : String(gender)] ||
          "other",
        interestedIn:
          interestedMap[
            Array.isArray(interestedIn) ? interestedIn[0] : String(interestedIn)
          ] || "everyone",
        age: Number(age),
        hobbies: hobbies.split(",").map((h) => h.trim()),
        education,
        relationshipGoals: goal,
        profileImage: profilePic
          ? {
              uri: Array.isArray(profilePic) ? profilePic[0] : profilePic,
              name: "profile.jpg",
              type: "image/jpeg",
            }
          : undefined,
      };

      // Call backend API
      const response = await createOrUpdateProfile(profileData);

      if ((response as any)?.success) {
        Toast.show({
          type: "success",
          text1: "Profile Saved",
          text2: "Your Profile has been successfully created.",
        });

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        throw new Error(response.message || "Failed to save profile");
      }
    } catch (error: any) {
      console.error("Profile Error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  };

  const isFormValid =
    hobbies.trim() &&
    goal &&
    location &&
    bio.trim().length >= 20 &&
    education.trim();

  const renderOptionModal = (
    visible: boolean,
    setVisible: (visible: boolean) => void,
    options: any[],
    onSelect: (value: string) => void,
    title: string
  ) => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => setVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionItem}
                onPress={() => {
                  onSelect(option.value);
                  setVisible(false);
                }}
              >
                <Ionicons name={option.icon} size={24} color="#ff6b6b" />
                <Text style={styles.optionText}>{option.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#ff6b6b", "#ff8e8e", "#ffa8a8", "#ffb3ba"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
          <View style={[styles.circle, styles.circle3]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: "66%" }]} />
            </View>
            <Text style={styles.progressText}>Step 2 of 3</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Title Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.heading}>Tell Your Story</Text>
              <Text style={styles.subHeading}>
                Share what makes you unique ✨
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Hobbies Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Feather name="heart" size={16} color="#fff" /> Hobbies &
                  Interests
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Hiking, Cooking, Reading, Music..."
                  placeholderTextColor="#999"
                  value={hobbies}
                  onChangeText={setHobbies}
                  multiline
                />
              </View>

              {/* Relationship Goals */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="heart-outline" size={16} color="#fff" />{" "}
                  Looking For
                </Text>
                <Pressable
                  style={[
                    styles.selectInput,
                    goal && styles.selectInputSelected,
                  ]}
                  onPress={() => setGoalModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      goal && styles.selectTextSelected,
                    ]}
                  >
                    {goal || "What are you looking for?"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={goal ? "#333" : "#999"}
                  />
                </Pressable>
              </View>

              {/* Location Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="location-outline" size={16} color="#fff" />{" "}
                  Location
                </Text>
                <Pressable
                  style={[
                    styles.selectInput,
                    location && styles.selectInputSelected,
                  ]}
                  onPress={() => setLocationModalVisible(true)}
                >
                  <Text
                    style={[
                      styles.selectText,
                      location && styles.selectTextSelected,
                    ]}
                  >
                    {location || "Where are you based?"}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={location ? "#333" : "#999"}
                  />
                </Pressable>
              </View>

              {/* Bio Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Feather name="edit" size={16} color="#fff" /> About Me
                </Text>
                <TextInput
                  style={[styles.input, styles.bioInput]}
                  placeholder="Share something interesting about yourself... What makes you smile? What's your story?"
                  placeholderTextColor="#999"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>
                  {bio.length}/200 characters{" "}
                  {bio.length >= 20 ? "✓" : "(min 20)"}
                </Text>
              </View>

              {/* Education/Occupation Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  <Ionicons name="school-outline" size={16} color="#fff" />{" "}
                  Education & Work
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Software Engineer at XYZ, MBA from ABC University"
                  placeholderTextColor="#999"
                  value={education}
                  onChangeText={setEducation}
                  multiline
                />
              </View>
            </View>

            {/* Finish Button */}
            <Pressable
              style={[
                styles.continueBtn,
                isFormValid && styles.continueBtnActive,
              ]}
              onPress={handleFinish}
              disabled={!isFormValid}
            >
              <Text style={styles.continueText}>Complete Profile</Text>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
            </Pressable>

            {/* Cultural Footer */}
            <View style={styles.culturalFooter}>
              <Text style={styles.culturalText}>
                &quot;The mountains teach us patience, the valleys teach us
                humility&quot;🏔️
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Modals */}
        {renderOptionModal(
          goalModalVisible,
          setGoalModalVisible,
          goalOptions,
          setGoal,
          "What Are You Looking For?"
        )}
        {renderOptionModal(
          locationModalVisible,
          setLocationModalVisible,
          locationOptions,
          setLocation,
          "Select Your Location"
        )}
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 1000,
  },
  circle1: {
    width: 120,
    height: 120,
    top: 150,
    right: -20,
  },
  circle2: {
    width: 80,
    height: 80,
    bottom: 300,
    left: -15,
  },
  circle3: {
    width: 60,
    height: 60,
    top: "40%",
    right: "15%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  progressText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentContainer: {
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  heading: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subHeading: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontWeight: "500",
  },
  formContainer: {
    width: "100%",
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
    marginLeft: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 50,
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
    marginLeft: 4,
  },
  selectInput: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 50,
  },
  selectInputSelected: {
    borderWidth: 2,
    borderColor: "#ff6b6b",
  },
  selectText: {
    fontSize: 16,
    color: "#999",
    flex: 1,
  },
  selectTextSelected: {
    color: "#333",
    fontWeight: "500",
  },
  continueBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
    marginBottom: 20,
  },
  continueBtnActive: {
    backgroundColor: "rgba(255, 106, 136, 0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    marginRight: 8,
  },
  culturalFooter: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  culturalText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  modalScroll: {
    maxHeight: height * 0.5,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    marginLeft: 16,
    fontWeight: "500",
  },
});
