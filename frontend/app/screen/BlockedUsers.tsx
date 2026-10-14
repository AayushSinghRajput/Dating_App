import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import {
  BlockedUser,
  getBlockedUsersApi,
  unblockUserApi,
} from "@/services/profileService";
import DetailHeader from "@/src/components/ui/DetailHeader";

export default function BlockedUsers() {
  const router = useRouter();
  const { colors } = useTheme();

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Confirmation Modal State
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<BlockedUser | null>(null);
  const [isClearAllMode, setIsClearAllMode] = useState(false);
  const [modalProcessing, setModalProcessing] = useState(false);

  useEffect(() => {
    let mounted = true;
    getBlockedUsersApi()
      .then((data) => {
        if (mounted) setBlockedUsers(data || []);
      })
      .catch((error: any) => {
        console.warn("[BlockedUsers] Failed to fetch blocked users:", error);
        Toast.show({
          type: "error",
          text1: "Failed to Load Blocked Users",
          text2: error?.message || "Please check your network connection.",
        });
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleBack = () => router.back();

  const handlePromptUnblock = (user: BlockedUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsClearAllMode(false);
    setConfirmTarget(user);
    setConfirmModalVisible(true);
  };

  const handlePromptClearAll = () => {
    if (blockedUsers.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsClearAllMode(true);
    setConfirmTarget(null);
    setConfirmModalVisible(true);
  };

  const handleConfirmAction = async () => {
    setModalProcessing(true);

    if (isClearAllMode) {
      try {
        await Promise.all(blockedUsers.map((u) => unblockUserApi(u._id)));
        setBlockedUsers([]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({
          type: "success",
          text1: "All Users Unblocked",
          text2: "Your blocked list has been cleared.",
        });
        setConfirmModalVisible(false);
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Toast.show({
          type: "error",
          text1: "Failed to Unblock All",
          text2: error?.message || "Please try again later.",
        });
      } finally {
        setModalProcessing(false);
      }
    } else if (confirmTarget) {
      const targetId = confirmTarget._id;
      setUnblockingId(targetId);
      try {
        await unblockUserApi(targetId);
        setBlockedUsers((prev) => prev.filter((u) => u._id !== targetId));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        Toast.show({
          type: "success",
          text1: "User Unblocked",
          text2: `${confirmTarget.username} has been removed from your blocked list.`,
        });
        setConfirmModalVisible(false);
      } catch (error: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        Toast.show({
          type: "error",
          text1: "Failed to Unblock",
          text2: error?.message || "Please try again.",
        });
      } finally {
        setUnblockingId(null);
        setModalProcessing(false);
      }
    }
  };

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return blockedUsers;
    const q = searchQuery.toLowerCase();
    return blockedUsers.filter(
      (u) =>
        u.username?.toLowerCase().includes(q) ||
        u.location?.toLowerCase().includes(q)
    );
  }, [blockedUsers, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <DetailHeader
        title="Blocked Users"
        onBack={handleBack}
        right={
          blockedUsers.length > 0 ? (
            <Pressable onPress={handlePromptClearAll} hitSlop={8}>
              <Text style={[styles.clearBtnText, { color: colors.accent }]}>
                Clear All
              </Text>
            </Pressable>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Privacy & Peace of Mind Banner */}
        <View style={styles.heroOuter}>
          <LinearGradient
            colors={["#e63946", "#ff6b78"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>CONFIDENTIAL & SAFE</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>Your Space, Protected</Text>
            <Text style={styles.heroSubtitle}>
              Blocked daters cannot view your profile, send messages, or discover you in swipe queues. Blocking is 100% discreet and private.
            </Text>

            {/* Trust Badges */}
            <View style={styles.trustPillRow}>
              <View style={styles.trustPill}>
                <Ionicons name="eye-off-outline" size={13} color="#ffffff" />
                <Text style={styles.trustPillText}>Invisible Profile</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="close-circle-outline" size={13} color="#ffffff" />
                <Text style={styles.trustPillText}>Zero Contact</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="lock-closed-outline" size={13} color="#ffffff" />
                <Text style={styles.trustPillText}>100% Secret</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Content Section */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading blocked list...
            </Text>
          </View>
        ) : blockedUsers.length === 0 ? (
          /* Empty State */
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.emptyIconCircle, { backgroundColor: "#d1fae5" }]}>
              <Ionicons name="shield-checkmark" size={38} color="#059669" />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Blocked Profiles
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
              You haven&apos;t blocked anyone yet. Enjoy safe, genuine connections with singles on Soulmate!
            </Text>
          </View>
        ) : (
          /* Blocked List Section */
          <View style={styles.listSection}>
            <View style={styles.listHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Blocked Accounts ({blockedUsers.length})
              </Text>
            </View>

            {/* Search Bar if > 2 users */}
            {blockedUsers.length > 2 && (
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
                ]}
              >
                <Ionicons name="search" size={18} color={colors.textSecondary} />
                <TextInput
                  placeholder="Search blocked users..."
                  placeholderTextColor={colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={[styles.searchInput, { color: colors.text }]}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
                  </Pressable>
                )}
              </View>
            )}

            {/* User Cards */}
            <View
              style={[
                styles.userCardGroup,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {filteredUsers.map((user, idx) => (
                <View
                  key={user._id}
                  style={[
                    styles.userRow,
                    idx !== filteredUsers.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.avatarWrap}>
                    <Image
                      source={{
                        uri:
                          user.profileImage ||
                          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop",
                      }}
                      style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}
                    />
                    <View style={styles.avatarBadge}>
                      <Ionicons name="close" size={10} color="#ffffff" />
                    </View>
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {user.username}
                      {user.age ? `, ${user.age}` : ""}
                    </Text>
                    {user.location ? (
                      <View style={styles.locationRow}>
                        <Ionicons name="location-outline" size={12} color={colors.textTertiary} />
                        <Text style={[styles.userLocation, { color: colors.textSecondary }]}>
                          {user.location}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.userLocation, { color: colors.textSecondary }]}>
                        Blocked profile
                      </Text>
                    )}
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.unblockBtn,
                      { borderColor: colors.accent },
                      unblockingId === user._id && { opacity: 0.6 },
                      pressed && { opacity: 0.8 },
                    ]}
                    onPress={() => handlePromptUnblock(user)}
                    disabled={unblockingId === user._id}
                  >
                    {unblockingId === user._id ? (
                      <ActivityIndicator size="small" color={colors.accent} />
                    ) : (
                      <Text style={[styles.unblockBtnText, { color: colors.accent }]}>
                        Unblock
                      </Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Safety & Reporting Insight Card */}
        <View
          style={[
            styles.safetyCard,
            { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.safetyCardTitle, { color: colors.text }]}>
              Blocking vs Reporting
            </Text>
            <Text style={[styles.safetyCardText, { color: colors.textSecondary }]}>
              Blocking prevents all interaction. If a profile harassed you or violated community safety guidelines, please also submit a report so our safety moderators can investigate.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !modalProcessing && setConfirmModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={[styles.modalIconWrap, { backgroundColor: colors.accentSoft }]}>
              <Ionicons
                name={isClearAllMode ? "trash-outline" : "person-add-outline"}
                size={26}
                color={colors.accent}
              />
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {isClearAllMode ? "Unblock All Users?" : `Unblock ${confirmTarget?.username}?`}
            </Text>

            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              {isClearAllMode
                ? "This will remove all blocked profiles from your block list. They will be able to see your profile and message you again."
                : `They will be able to discover your profile and message you on Soulmate again.`}
            </Text>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                onPress={() => setConfirmModalVisible(false)}
                disabled={modalProcessing}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.modalConfirmBtn}
                onPress={handleConfirmAction}
                disabled={modalProcessing}
              >
                <LinearGradient
                  colors={["#e63946", "#ff6b78"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalConfirmGradient}
                >
                  {modalProcessing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalConfirmText}>
                      {isClearAllMode ? "Yes, Clear All" : "Yes, Unblock"}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroOuter: {
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: "#e63946",
    shadowOpacity: 0.22,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  heroCard: {
    borderRadius: 20,
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.35)",
  },
  heroPillText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontSize: 13.5,
    color: "rgba(255, 255, 255, 0.95)",
    lineHeight: 19,
    marginBottom: 14,
  },
  trustPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.18)",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  trustPillText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  loadingBox: {
    padding: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyCard: {
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    padding: 30,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  listSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  listHeaderRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  userCardGroup: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userLocation: {
    fontSize: 12,
  },
  unblockBtn: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 14,
    minWidth: 78,
    alignItems: "center",
    justifyContent: "center",
  },
  unblockBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  safetyCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
  },
  safetyCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  safetyCardText: {
    fontSize: 12,
    lineHeight: 16,
  },

  /* Confirmation Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 8,
  },
  modalIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 8,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  modalConfirmBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalConfirmGradient: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
