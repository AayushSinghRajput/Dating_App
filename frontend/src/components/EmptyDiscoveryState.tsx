import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { getProfile } from "@/services/profileService";
import { getMatches, rewindLastSwipe, MatchProfile } from "@/services/matchService";
import { createOrGetChat } from "@/services/chatService";
import { radius } from "@/src/theme/radius";

interface EmptyDiscoveryStateProps {
  onRefresh: () => void;
  refreshing: boolean;
}

export default function EmptyDiscoveryState({
  onRefresh,
  refreshing,
}: EmptyDiscoveryStateProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchProfile[]>([]);
  const [rewinding, setRewinding] = useState(false);
  const [openingChatId, setOpeningChatId] = useState<string | null>(null);

  // Concentric radar pulse animations
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Load current user profile avatar & matches list
    getProfile()
      .then((p) => setAvatarUrl(p.profileImage || null))
      .catch(() => {});

    getMatches()
      .then((m) => setMatches(m || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const createLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = createLoop(pulse1, 0);
    const a2 = createLoop(pulse2, 800);
    const a3 = createLoop(pulse3, 1600);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [pulse1, pulse2, pulse3]);

  const handleRewind = async () => {
    if (rewinding) return;
    setRewinding(true);
    try {
      await rewindLastSwipe();
      Toast.show({
        type: "success",
        text1: "Last swipe undone!",
        text2: "Profile restored to your deck.",
      });
      onRefresh();
    } catch (err: any) {
      if (err.message?.includes("Premium")) {
        Toast.show({
          type: "info",
          text1: "Rewind is a Premium feature",
          text2: "Tap to upgrade",
          onPress: () => router.push("/screen/PaymentSettings"),
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Could not rewind",
          text2: err?.message || "No recent swipes to undo.",
        });
      }
    } finally {
      setRewinding(false);
    }
  };

  const handleOpenChat = async (match: MatchProfile) => {
    setOpeningChatId(match.userId);
    try {
      const chat = await createOrGetChat(match.userId);
      router.push({
        pathname: "/screen/ChatDetail/[chatId]",
        params: {
          chatId: chat._id,
          name: match.name,
          avatar: match.profileImage || "",
          otherUserId: match.userId,
        },
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Failed to open chat",
        text2: err?.message || "Please try again.",
      });
    } finally {
      setOpeningChatId(null);
    }
  };

  const renderPulseStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2.4],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.6, 1],
      outputRange: [0.65, 0.3, 0],
    }),
  });

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      {/* Animated Radar Beacon */}
      <View style={styles.radarContainer}>
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: colors.accent, backgroundColor: colors.accentSoft },
            renderPulseStyle(pulse1),
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: colors.accent, backgroundColor: colors.accentSoft },
            renderPulseStyle(pulse2),
          ]}
        />
        <Animated.View
          style={[
            styles.pulseRing,
            { borderColor: colors.accent, backgroundColor: colors.accentSoft },
            renderPulseStyle(pulse3),
          ]}
        />

        <Pressable
          style={({ pressed }) => [
            styles.avatarCircle,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && styles.avatarCirclePressed,
          ]}
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityRole="button"
          accessibilityLabel="Scan for new profiles"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} contentFit="cover" />
          ) : (
            <Ionicons name="person" size={44} color={colors.textTertiary} />
          )}

          {refreshing ? (
            <View style={styles.avatarLoadingOverlay}>
              <ActivityIndicator size="small" color="#fff" />
            </View>
          ) : (
            <View style={[styles.beaconDot, { backgroundColor: colors.accent }]}>
              <Ionicons name="sync-outline" size={12} color="#fff" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Main Copy */}
      <View style={styles.textContainer}>
        <Text style={[styles.headline, { color: colors.text }]}>
          You&apos;re All Caught Up! 🎉
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          You&apos;ve seen everyone nearby for now. Widen your preferences or say hi to your matches!
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Primary Action: Adjust Preferences */}
        <Pressable
          style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
          onPress={() => router.push("/screen/ProfileEdit")}
        >
          <Ionicons name="options-outline" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>Widen Search Preferences</Text>
        </Pressable>

        {/* Secondary Row: Rewind & View Matches */}
        <View style={styles.secondaryRow}>
          <Pressable
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
            onPress={handleRewind}
            disabled={rewinding}
          >
            {rewinding ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="arrow-undo-outline" size={16} color={colors.text} />
                <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Rewind</Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={[
              styles.secondaryBtn,
              { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
            ]}
            onPress={() => router.push("/(tabs)/likes")}
          >
            <Ionicons name="heart-outline" size={16} color={colors.accent} />
            <Text style={[styles.secondaryBtnText, { color: colors.text }]}>View Likes</Text>
          </Pressable>
        </View>
      </View>

      {/* Matches Carousel (If user has matches) */}
      {matches.length > 0 && (
        <View style={[styles.matchesSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.matchesHeader}>
            <View style={styles.matchesHeaderTitleRow}>
              <Ionicons name="chatbubbles" size={18} color="#ff7b00" />
              <Text style={[styles.matchesSectionTitle, { color: colors.text }]}>
                Your Matches
              </Text>
              <View style={[styles.matchBadge, { backgroundColor: "#ff7b00" }]}>
                <Text style={styles.matchBadgeText}>{matches.length}</Text>
              </View>
            </View>
            <Text style={[styles.matchesSectionSubtitle, { color: colors.textSecondary }]}>
              Say hello while you wait for new people!
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.matchesScroll}
          >
            {matches.map((item) => (
              <Pressable
                key={item.id}
                style={styles.matchItem}
                onPress={() => handleOpenChat(item)}
                disabled={openingChatId === item.userId}
              >
                <View style={styles.matchAvatarWrapper}>
                  <Image
                    source={{ uri: item.profileImage || "https://placehold.co/150x150" }}
                    style={styles.matchAvatar}
                    contentFit="cover"
                  />
                  <View style={[styles.chatPillBadge, { backgroundColor: colors.accent }]}>
                    {openingChatId === item.userId ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="chatbubble" size={10} color="#fff" />
                    )}
                  </View>
                </View>
                <Text style={[styles.matchName, { color: colors.text }]} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 12,
    alignItems: "center",
  },
  radarContainer: {
    width: 170,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  pulseRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  avatarCirclePressed: {
    transform: [{ scale: 0.94 }],
    opacity: 0.9,
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  beaconDot: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  headline: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  actionsContainer: {
    width: "100%",
    gap: 12,
    marginBottom: 28,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: radius.full,
    gap: 8,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    gap: 6,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  matchesSection: {
    width: "100%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 0,
  },
  matchesHeader: {
    marginBottom: 14,
  },
  matchesHeaderTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  matchesSectionTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  matchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  matchBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  matchesSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  matchesScroll: {
    gap: 14,
    paddingVertical: 4,
  },
  matchItem: {
    alignItems: "center",
    width: 64,
  },
  matchAvatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: 29,
    position: "relative",
    marginBottom: 6,
  },
  matchAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  chatPillBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  matchName: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});
