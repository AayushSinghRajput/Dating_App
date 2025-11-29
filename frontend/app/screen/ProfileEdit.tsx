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

export default function ProfileEdit() {
  const router = useRouter();
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#1a1a1a" />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Image Section */}
        <View style={styles.imageSection}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: loggedUser.avatar }} 
              style={styles.avatar}
            />
            <Pressable style={styles.editImageButton}>
              <Ionicons name="camera" size={20} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.imageHint}>Tap to change photo</Text>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          {/* Full Name */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Full Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput 
              style={styles.input} 
              value={name} 
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Age */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Age <Text style={styles.required}>*</Text>
            </Text>
            <TextInput 
              style={styles.input} 
              value={age} 
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="Enter your age"
              placeholderTextColor="#999"
              maxLength={3}
            />
          </View>

          {/* Location */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <TextInput 
              style={styles.input} 
              value={location} 
              onChangeText={setLocation}
              placeholder="Enter your location"
              placeholderTextColor="#999"
            />
          </View>

          {/* Bio */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Tell us about yourself..."
              placeholderTextColor="#999"
              maxLength={500}
            />
            <Text style={styles.charCount}>{bio.length}/500</Text>
          </View>

          {/* Additional Fields */}
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Profession</Text>
            <TextInput 
              style={styles.input} 
              placeholder="What do you do?"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Interests</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Add your hobbies and interests"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Pressable 
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
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
            style={styles.cancelButton}
            onPress={handleBack}
            disabled={isSaving}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
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
    backgroundColor: "#fff",
    paddingHorizontal: 16, // Reduced horizontal padding
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    borderBottomLeftRadius: 20, // Added border radius to bottom left
    borderBottomRightRadius: 20, // Added border radius to bottom right
    shadowColor: "#000",
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
    color: "#1a1a1a",
  },
  headerPlaceholder: {
    width: 40,
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#fff",
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
    borderColor: "#FF6B6B",
  },
  editImageButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B6B",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  imageHint: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  formSection: {
    backgroundColor: "#fff",
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
    color: "#1a1a1a",
    marginBottom: 8,
  },
  required: {
    color: "#FF6B6B",
  },
  input: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: "#FF6B6B",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
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
    borderColor: "#e9ecef",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  cancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
});