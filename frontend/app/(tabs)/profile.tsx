import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getProfile } from "../../utils/api"; 

interface UserProfile {
  profileImage?: string;
  username:string;
  location?: string;
  aboutMe?: string;
  gender?: string;
  interestedIn?: string;
  age?: number;
  hobbies?: string[];
  education?: string;
  profession?: string;
  relationshipGoals?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile from backend
  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const profileData = await getProfile(); 

      // Map backend Profile -> UserProfile
      const mappedProfile: UserProfile = {
        username: profileData.user?.username || "Unknown", 
        profileImage: profileData.profileImage,
        location: profileData.location,
        aboutMe: profileData.aboutMe,
        gender: profileData.gender,
        interestedIn: profileData.interestedIn,
        age: profileData.age,
        hobbies: profileData.hobbies,
        education: profileData.education,
        profession: profileData.profession,
        relationshipGoals: profileData.relationshipGoals,
      };

      setProfile(mappedProfile); 
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  fetchProfile();
}, []);


  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#e63946" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { justifyContent: "center" }]}>
        <Text style={{ textAlign: "center", color: "#555" }}>
          No profile data found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignItems: "center", paddingBottom: 30 }}
    >
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{
            uri:
              profile.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png",
          }}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile.username}</Text>
        {profile.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.location}>{profile.location}</Text>
          </View>
        )}
      </View>

      {/* About Me */}
      {profile.aboutMe && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={20} color="#e63946" />
            <Text style={styles.sectionTitle}>About Me</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.sectionContent}>{profile.aboutMe}</Text>
          </View>
        </View>
      )}

      {/* Personal Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={20} color="#e63946" />
          <Text style={styles.sectionTitle}>Personal Info</Text>
        </View>
        <View style={styles.infoCard}>
          {profile.gender && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="male-female" size={16} color="#e63946" />
                <Text style={styles.infoTitle}>Gender</Text>
              </View>
              <Text style={styles.infoContent}>{profile.gender}</Text>
            </View>
          )}
          {profile.interestedIn && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="heart" size={16} color="#e63946" />
                <Text style={styles.infoTitle}>Interested In</Text>
              </View>
              <Text style={styles.infoContent}>{profile.interestedIn}</Text>
            </View>
          )}
          {profile.age && (
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar" size={16} color="#e63946" />
                <Text style={styles.infoTitle}>Age</Text>
              </View>
              <Text style={styles.infoContent}>{profile.age} years</Text>
            </View>
          )}
        </View>
      </View>

      {/* Hobbies */}
      {profile.hobbies && profile.hobbies.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="game-controller" size={20} color="#e63946" />
            <Text style={styles.sectionTitle}>Hobbies & Interests</Text>
          </View>
          <View style={styles.hobbiesWrapper}>
            {profile.hobbies.map((hobby, index) => (
              <View key={index} style={styles.hobbyBadge}>
                <Ionicons name="star" size={14} color="#fff" />
                <Text style={styles.hobbyText}>{hobby}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Education & Profession */}
      {(profile.education || profile.profession) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={20} color="#e63946" />
            <Text style={styles.sectionTitle}>Education & Work</Text>
          </View>
          <View style={styles.infoCard}>
            {profile.education && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="school" size={16} color="#e63946" />
                  <Text style={styles.infoTitle}>Education</Text>
                </View>
                <Text style={styles.infoContent}>{profile.education}</Text>
              </View>
            )}
            {profile.profession && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <Ionicons name="briefcase" size={16} color="#e63946" />
                  <Text style={styles.infoTitle}>Profession</Text>
                </View>
                <Text style={styles.infoContent}>{profile.profession}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Relationship Goals */}
      {profile.relationshipGoals && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="flag" size={20} color="#e63946" />
            <Text style={styles.sectionTitle}>Relationship Goals</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={styles.sectionContent}>{profile.relationshipGoals}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa" 
  },
  header: { 
    alignItems: "center", 
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: "100%",
    backgroundColor: "#fff",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#e63946",
  },
  name: { 
    fontSize: 24, 
    fontWeight: "700", 
    color: "#1d3557",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1faee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  location: { 
    fontSize: 14, 
    color: "#457b9d", 
    marginLeft: 4,
    fontWeight: "500",
  },

  section: {
    width: "90%",
    backgroundColor: "#fff",
    padding: 0,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1d3557",
    marginLeft: 8,
  },
  contentCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sectionContent: { 
    fontSize: 15, 
    color: "#495057", 
    lineHeight: 22,
    textAlign: "left",
  },
  
  infoCard: {
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTitle: { 
    fontWeight: "600", 
    color: "#1d3557",
    fontSize: 14,
    marginLeft: 8,
  },
  infoContent: { 
    color: "#495057", 
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  
  hobbiesWrapper: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  hobbyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e63946",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    shadowColor: "#e63946",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  hobbyText: { 
    color: "#fff", 
    marginLeft: 4, 
    fontSize: 12,
    fontWeight: "600",
  },
});