import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

interface BlockedUser {
  id: string;
  name: string;
  avatar: string;
  age: number;
  location: string;
  blockedDate: string;
  mutualInterests?: string[];
}

export default function BlockedUsers() {
  const router = useRouter();
  const { colors } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([
    {
      id: "1",
      name: "Alex Johnson",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      age: 28,
      location: "New York, NY",
      blockedDate: "2 days ago",
      mutualInterests: ["Travel", "Photography", "Hiking", "Coffee"]
    },
    {
      id: "2",
      name: "Sarah Miller",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      age: 25,
      location: "Los Angeles, CA",
      blockedDate: "1 week ago",
      mutualInterests: ["Music", "Dancing", "Art"]
    },
    {
      id: "3",
      name: "Mike Chen",
      avatar: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=150&h=150&fit=crop&crop=face",
      age: 32,
      location: "Chicago, IL",
      blockedDate: "3 weeks ago",
      mutualInterests: ["Technology", "Gaming", "Fitness", "Reading", "Cooking"]
    }
  ]);

  const handleBack = () => {
    router.back();
  };

  const unblockUser = (userId: string, userName: string) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${userName}? They will be able to see your profile and send you messages again.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          style: "destructive",
          onPress: () => {
            setBlockedUsers(prev => prev.filter(user => user.id !== userId));
            Alert.alert("Success", `${userName} has been unblocked.`);
          }
        },
      ]
    );
  };

  const clearAllBlocked = () => {
    if (blockedUsers.length === 0) return;

    Alert.alert(
      "Clear All Blocked Users",
      "Are you sure you want to unblock all users? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            setBlockedUsers([]);
            Alert.alert("Cleared", "All users have been unblocked.");
          }
        },
      ]
    );
  };

  const BlockedUserCard = ({ user }: { user: BlockedUser }) => (
    <View style={[styles.userCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={styles.userMainInfo}>
        <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.accentSoft }]} />
        <View style={styles.userBasicInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
            <Text style={[styles.userAge, { color: colors.textSecondary }]}>, {user.age}</Text>
          </View>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.userLocation, { color: colors.textSecondary }]}>{user.location}</Text>
          </View>
          <Text style={[styles.blockedDate, { color: colors.textTertiary }]}>Blocked {user.blockedDate}</Text>
        </View>
      </View>

      {/* Interests attached to Unblock button */}
      <View style={styles.actionSection}>
        {user.mutualInterests && user.mutualInterests.length > 0 && (
          <View style={styles.interestsContainer}>
            <View style={styles.interestsRow}>
              {user.mutualInterests.slice(0, 3).map((interest, index) => (
                <View key={index} style={[styles.interestTag, { backgroundColor: colors.accentSoft, borderColor: colors.accentSoftPressed }]}>
                  <Text style={[styles.interestText, { color: colors.accent }]}>{interest}</Text>
                </View>
              ))}
              {user.mutualInterests.length > 3 && (
                <Text style={[styles.moreInterests, { color: colors.textTertiary }]}>+{user.mutualInterests.length - 3}</Text>
              )}
            </View>
          </View>
        )}

        <Pressable
          style={[styles.unblockButton, { backgroundColor: colors.surface, borderColor: colors.accent }]}
          onPress={() => unblockUser(user.id, user.name)}
        >
          <Ionicons name="lock-open-outline" size={16} color={colors.accent} />
          <Text style={[styles.unblockText, { color: colors.accent }]}>Unblock</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border, shadowColor: colors.shadow }]}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blocked Users</Text>
        <Pressable style={styles.clearButton} onPress={clearAllBlocked}>
          <Text style={[styles.clearButtonText, { color: colors.accent }]}>Clear All</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="people-outline" size={24} color={colors.accent} />
            <View style={styles.statText}>
              <Text style={[styles.statNumber, { color: colors.text }]}>{blockedUsers.length}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Users Blocked</Text>
            </View>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
            <View style={styles.statText}>
              <Text style={[styles.statNumber, { color: colors.text }]}>100%</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Privacy Protected</Text>
            </View>
          </View>
        </View>

        {/* Blocked Users List */}
        <View style={[styles.section, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Blocked Accounts</Text>
            <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
              These users cannot see your profile or contact you
            </Text>
          </View>

          {blockedUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={64} color={colors.success} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Blocked Users</Text>
              <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
                You haven&apos;t blocked any users yet. Your block list will appear here.
              </Text>
            </View>
          ) : (
            <View style={styles.usersList}>
              {blockedUsers.map((user) => (
                <BlockedUserCard key={user.id} user={user} />
              ))}
            </View>
          )}
        </View>

        {/* Information Section */}
        <View style={[styles.infoSection, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>About Blocking</Text>
            <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
              • Blocked users cannot see your profile or send you messages{"\n"}
              • You can unblock users at any time{"\n"}
              • Blocking is private - users are not notified
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={[styles.quickAction, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Blocking Help</Text>
          </Pressable>
          <Pressable style={[styles.quickAction, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
            <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            <Text style={[styles.quickActionText, { color: colors.textSecondary }]}>Privacy Policy</Text>
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
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  statsSection: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop:16,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  statText: {
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    elevation: 4,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  usersList: {
    gap: 16,
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  userMainInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    marginRight: 12,
  },
  userBasicInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userAge: {
    fontSize: 14,
    fontWeight: "500",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 12,
  },
  blockedDate: {
    fontSize: 11,
    fontWeight: "500",
  },
  actionSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  interestsContainer: {
    flex: 1,
    marginRight: 12,
  },
  interestsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  interestTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  interestText: {
    fontSize: 10,
    fontWeight: "600",
  },
  moreInterests: {
    fontSize: 10,
    fontWeight: "500",
    marginBottom: 4,
  },
  unblockButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 90,
    height: 40,
  },
  unblockText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginHorizontal: 16,
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
