import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, ActivityIndicator } from "react-native";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { BlockedUser, getBlockedUsersApi, unblockUserApi } from "@/services/profileService";
import DetailHeader from "@/src/components/ui/DetailHeader";

export default function BlockedUsers() {
  const router = useRouter();
  const { colors } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getBlockedUsersApi();
        setBlockedUsers(data);
      } catch (error: any) {
        Toast.show({ type: "error", text1: "Failed to load blocked users", text2: error.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          onPress: async () => {
            setUnblockingId(userId);
            try {
              await unblockUserApi(userId);
              setBlockedUsers((prev) => prev.filter((user) => user._id !== userId));
            } catch (error: any) {
              Toast.show({ type: "error", text1: "Failed to unblock", text2: error.message });
            } finally {
              setUnblockingId(null);
            }
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
          onPress: async () => {
            try {
              await Promise.all(blockedUsers.map((u) => unblockUserApi(u._id)));
              setBlockedUsers([]);
            } catch (error: any) {
              Toast.show({ type: "error", text1: "Failed to unblock everyone", text2: error.message });
            }
          }
        },
      ]
    );
  };

  const BlockedUserCard = ({ user }: { user: BlockedUser }) => (
    <View style={[styles.userCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <View style={styles.userMainInfo}>
        <Image
          source={{ uri: user.profileImage || "https://placehold.co/100x100" }}
          style={[styles.avatar, { borderColor: colors.accentSoft }]}
        />
        <View style={styles.userBasicInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, { color: colors.text }]}>{user.username}</Text>
            {user.age && <Text style={[styles.userAge, { color: colors.textSecondary }]}>, {user.age}</Text>}
          </View>
          {user.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={[styles.userLocation, { color: colors.textSecondary }]}>{user.location}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionSection}>
        <Pressable
          style={[styles.unblockButton, { backgroundColor: colors.surface, borderColor: colors.accent }]}
          onPress={() => unblockUser(user._id, user.username)}
          disabled={unblockingId === user._id}
        >
          {unblockingId === user._id ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Ionicons name="lock-open-outline" size={16} color={colors.accent} />
              <Text style={[styles.unblockText, { color: colors.accent }]}>Unblock</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader
        title="Blocked Users"
        onBack={handleBack}
        right={
          blockedUsers.length > 0 ? (
            <Pressable onPress={clearAllBlocked} hitSlop={8}>
              <Text style={[styles.clearButtonText, { color: colors.accent }]}>Clear All</Text>
            </Pressable>
          ) : undefined
        }
      />

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

          {loading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : blockedUsers.length === 0 ? (
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
                <BlockedUserCard key={user._id} user={user} />
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
    </View>
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
  actionSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
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
