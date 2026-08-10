import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "@/contexts/NotificationContext";
import { getLikedByMe } from "@/services/matchService";
import { usePremiumActions } from "@/src/hooks/usePremiumActions";
import { showActionSheet } from "@/src/components/GlobalActionSheet";
import ScreenHeader, { ScreenHeaderAction } from "@/src/components/ui/ScreenHeader";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";
import { useTheme } from "@/contexts/ThemeContext";

const logo = require("../../assets/images/logo.png");

export default function HomeHeader() {
  const router = useRouter();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const [likedByCount, setLikedByCount] = useState(0);
  const { status, handleRewind, handleBoost } = usePremiumActions();

  useEffect(() => {
    getLikedByMe()
      .then((profiles) => setLikedByCount(profiles.length))
      .catch(() => {});
  }, []);

  const openPremiumActions = () => {
    showActionSheet({
      title: "Get noticed",
      options: [
        { label: status?.boostActive ? "Boosted — priority visibility active" : "⚡ Boost My Profile", onPress: handleBoost },
        { label: "↩️ Rewind Last Swipe", onPress: handleRewind },
      ],
    });
  };

  const actions: ScreenHeaderAction[] = [
    {
      icon: status?.boostActive ? "flash" : "flash-outline",
      active: status?.boostActive,
      onPress: openPremiumActions,
      accessibilityLabel: "Boost or rewind",
    },
    {
      icon: "heart-outline",
      badge: likedByCount,
      onPress: () => router.push("/screen/LikedYou"),
      accessibilityLabel: "Who liked you",
    },
    {
      icon: "notifications-outline",
      badge: unreadCount,
      onPress: () => router.push("/screen/Notification"),
      accessibilityLabel: "Notifications",
    },
  ];

  return (
    <ScreenHeader
      left={
        <View style={styles.brand}>
          <Image source={logo} style={styles.logo} resizeMode="cover" />
          <Text style={[styles.wordmark, { color: colors.text }]}>Soulmate</Text>
        </View>
      }
      actions={actions}
    />
  );
}

const styles = StyleSheet.create({
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  wordmark: {
    ...typography.h2,
  },
});
