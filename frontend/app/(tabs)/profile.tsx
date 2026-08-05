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
import { useTheme } from "@/contexts/ThemeContext";

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
  const { colors } = useTheme();
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
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center" }]}>
        <Text style={{ textAlign: "center", color: colors.textSecondary }}>
          No profile data found.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ alignItems: "center", paddingBottom: 30 }}
    >
      {/* Profile Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <Image
          source={{
            uri:
              profile.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png",
          }}
          style={[styles.avatar, { borderColor: colors.accent }]}
        />
        <Text style={[styles.name, { color: colors.text }]}>{profile.username}</Text>
        {profile.location && (
          <View style={[styles.locationContainer, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={[styles.location, { color: colors.textSecondary }]}>{profile.location}</Text>
          </View>
        )}
      </View>

      {/* About Me */}
      {profile.aboutMe && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
            <Ionicons name="person-circle" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About Me</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{profile.aboutMe}</Text>
          </View>
        </View>
      )}

      {/* Personal Info */}
      <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
        <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
          <Ionicons name="information-circle" size={20} color={colors.accent} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Info</Text>
        </View>
        <View style={styles.infoCard}>
          {profile.gender && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={styles.infoLabel}>
                <Ionicons name="male-female" size={16} color={colors.accent} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>Gender</Text>
              </View>
              <Text style={[styles.infoContent, { color: colors.textSecondary }]}>{profile.gender}</Text>
            </View>
          )}
          {profile.interestedIn && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={styles.infoLabel}>
                <Ionicons name="heart" size={16} color={colors.accent} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>Interested In</Text>
              </View>
              <Text style={[styles.infoContent, { color: colors.textSecondary }]}>{profile.interestedIn}</Text>
            </View>
          )}
          {profile.age && (
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={styles.infoLabel}>
                <Ionicons name="calendar" size={16} color={colors.accent} />
                <Text style={[styles.infoTitle, { color: colors.text }]}>Age</Text>
              </View>
              <Text style={[styles.infoContent, { color: colors.textSecondary }]}>{profile.age} years</Text>
            </View>
          )}
        </View>
      </View>

      {/* Hobbies */}
      {profile.hobbies && profile.hobbies.length > 0 && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
            <Ionicons name="game-controller" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Hobbies & Interests</Text>
          </View>
          <View style={styles.hobbiesWrapper}>
            {profile.hobbies.map((hobby, index) => (
              <View key={index} style={[styles.hobbyBadge, { backgroundColor: colors.accent, shadowColor: colors.accent }]}>
                <Ionicons name="star" size={14} color="#fff" />
                <Text style={styles.hobbyText}>{hobby}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Education & Profession */}
      {(profile.education || profile.profession) && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
            <Ionicons name="business" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Education & Work</Text>
          </View>
          <View style={styles.infoCard}>
            {profile.education && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="school" size={16} color={colors.accent} />
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Education</Text>
                </View>
                <Text style={[styles.infoContent, { color: colors.textSecondary }]}>{profile.education}</Text>
              </View>
            )}
            {profile.profession && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <View style={styles.infoLabel}>
                  <Ionicons name="briefcase" size={16} color={colors.accent} />
                  <Text style={[styles.infoTitle, { color: colors.text }]}>Profession</Text>
                </View>
                <Text style={[styles.infoContent, { color: colors.textSecondary }]}>{profile.profession}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Relationship Goals */}
      {profile.relationshipGoals && (
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.surfaceAlt, borderBottomColor: colors.border }]}>
            <Ionicons name="flag" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Relationship Goals</Text>
          </View>
          <View style={styles.contentCard}>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{profile.relationshipGoals}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    paddingVertical: 25,
    paddingHorizontal: 20,
    width: "100%",
    marginBottom: 15,
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
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 4,
  },
  location: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: "500",
  },

  section: {
    width: "90%",
    padding: 0,
    borderRadius: 16,
    marginBottom: 16,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  contentCard: {
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  sectionContent: {
    fontSize: 15,
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
  },
  infoLabel: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTitle: {
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
  infoContent: {
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
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