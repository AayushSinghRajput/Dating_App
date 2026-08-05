import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Image,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

const { width, height } = Dimensions.get('window');

export default function DetailFirst() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [interestedIn, setInterestedIn] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [interestedModalVisible, setInterestedModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(30));

  const genderOptions = [
    { label: "Male", icon: "male", value: "Male" },
    { label: "Female", icon: "female", value: "Female" },
    { label: "Non-binary", icon: "transgender", value: "Non-binary" },
    { label: "Other", icon: "help-circle", value: "Other" },
  ];

  const interestedOptions = [
    { label: "Men", icon: "male", value: "Men" },
    { label: "Women", icon: "female", value: "Women" },
    { label: "Everyone", icon: "people", value: "Everyone" },
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

  const handlePickImage = async () => {
    Alert.alert(
      "Select Photo",
      "Choose how you'd like to add your photo",
      [
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Gallery",
          onPress: () => openGallery(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Denied", "You need to allow camera access.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0].uri);
    }
  };

  const openGallery = async () => {
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
      setProfilePic(result.assets[0].uri);
    }
  };

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert("Missing Information", "Please enter your name.");
      return;
    }
    if (!age || parseInt(age) < 18 || parseInt(age) > 100) {
      Alert.alert("Invalid Age", "Please enter a valid age (18-100).");
      return;
    }
    if (!gender) {
      Alert.alert("Missing Information", "Please select your gender.");
      return;
    }
    if (!interestedIn) {
      Alert.alert("Missing Information", "Please select who you're interested in.");
      return;
    }
    if (!profilePic) {
      Alert.alert("Missing Photo", "Please add a profile picture.");
      return;
    }
    router.push({pathname: "/screen/DetailSecond",
      params:{
        name,
        age,
        gender,
        interestedIn,
        profilePic,
      },
    });
  };

  const isFormValid = name.trim() && age && gender && interestedIn && profilePic;

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
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.optionItem, { borderBottomColor: colors.border }]}
              onPress={() => {
                onSelect(option.value);
                setVisible(false);
              }}
            >
              <Ionicons name={option.icon} size={24} color={colors.accent} />
              <Text style={[styles.optionText, { color: colors.text }]}>{option.label}</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <StatusBar barStyle={colors.statusBarStyle} translucent backgroundColor="transparent" />
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
              <View style={[styles.progressFill, { width: '33%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 3</Text>
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
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Title Section */}
            <View style={styles.titleContainer}>
              <Text style={styles.heading}>Create Your Profile</Text>
              <Text style={styles.subHeading}>
                Let&apos;s get to know you better 🌟
              </Text>
            </View>

            {/* Profile Picture Section */}
            <View style={styles.photoSection}>
              <Pressable style={styles.imageWrapper} onPress={handlePickImage}>
                {profilePic ? (
                  <>
                    <Image source={{ uri: profilePic }} style={styles.imagePreview} />
                    <View style={[styles.editOverlay, { backgroundColor: colors.accent }]}>
                      <Feather name="edit-2" size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <View style={styles.placeholderContent}>
                    <Ionicons name="camera" size={32} color={colors.accent} />
                    <Text style={[styles.imagePlaceholder, { color: colors.accent }]}>Add Photo</Text>
                  </View>
                )}
              </Pressable>
              <Text style={styles.uploadText}>
                {profilePic ? "Tap to change photo" : "Add your best photo"}
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textTertiary}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Age Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Age</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow }]}
                  placeholder="Enter your age"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  value={age}
                  onChangeText={setAge}
                  maxLength={2}
                />
              </View>

              {/* Gender Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Gender</Text>
                <Pressable
                  style={[
                    styles.selectInput,
                    { backgroundColor: colors.surface, shadowColor: colors.shadow },
                    gender && [styles.selectInputSelected, { borderColor: colors.accent }],
                  ]}
                  onPress={() => setGenderModalVisible(true)}
                >
                  <Text style={[styles.selectText, { color: colors.textTertiary }, gender && [styles.selectTextSelected, { color: colors.text }]]}>
                    {gender || "Select your gender"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={gender ? colors.text : colors.textTertiary} />
                </Pressable>
              </View>

              {/* Interested In Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Interested In</Text>
                <Pressable
                  style={[
                    styles.selectInput,
                    { backgroundColor: colors.surface, shadowColor: colors.shadow },
                    interestedIn && [styles.selectInputSelected, { borderColor: colors.accent }],
                  ]}
                  onPress={() => setInterestedModalVisible(true)}
                >
                  <Text style={[styles.selectText, { color: colors.textTertiary }, interestedIn && [styles.selectTextSelected, { color: colors.text }]]}>
                    {interestedIn || "Who are you interested in?"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={interestedIn ? colors.text : colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            {/* Continue Button */}
            <Pressable 
              style={[styles.continueBtn, isFormValid && styles.continueBtnActive]} 
              onPress={handleNext}
              disabled={!isFormValid}
            >
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>

            {/* Cultural Footer */}
            <View style={styles.culturalFooter}>
              <Text style={styles.culturalText}>
                &quot;Every journey begins with a single step&quot; 🏔️
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Modals */}
        {renderOptionModal(
          genderModalVisible,
          setGenderModalVisible,
          genderOptions,
          setGender,
          "Select Your Gender"
        )}
        {renderOptionModal(
          interestedModalVisible,
          setInterestedModalVisible,
          interestedOptions,
          setInterestedIn,
          "Who Are You Interested In?"
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
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1000,
  },
  circle1: {
    width: 150,
    height: 150,
    top: 100,
    right: -30,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: 200,
    left: -20,
  },
  circle3: {
    width: 80,
    height: 80,
    top: '60%',
    right: '20%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  progressText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  contentContainer: {
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  heading: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subHeading: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    fontWeight: '500',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  imagePreview: {
    width: 136,
    height: 136,
    borderRadius: 68,
  },
  editOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  placeholderContent: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  uploadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectInput: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  selectInputSelected: {
    borderWidth: 2,
  },
  selectText: {
    fontSize: 16,
    flex: 1,
  },
  selectTextSelected: {
    fontWeight: '500',
  },
  continueBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    marginBottom: 20,
  },
  continueBtnActive: {
    backgroundColor: 'rgba(255, 106, 136, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    marginRight: 8,
  },
  culturalFooter: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  culturalText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    maxHeight: height * 0.6,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 16,
    fontWeight: '500',
  },
});