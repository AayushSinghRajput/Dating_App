import { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useNotifications } from "@/contexts/NotificationContext";
import { getProfile } from "@/services/profileService";
import { usePremiumActions } from "@/src/hooks/usePremiumActions";
import { showActionSheet } from "@/src/components/GlobalActionSheet";
import ScreenHeader, { ScreenHeaderAction } from "@/src/components/ui/ScreenHeader";
import Avatar from "@/src/components/ui/Avatar";
import { spacing } from "@/src/theme/spacing";
import { typography } from "@/src/theme/typography";
import { useTheme } from "@/contexts/ThemeContext";

const logo = require("../../assets/images/logo.png");

export default function HomeHeader() {
  const router = useRouter();
  const { colors } = useTheme();
  const { unreadCount } = useNotifications();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { status, handleRewind, handleBoost } = usePremiumActions();

  useEffect(() => {
    getProfile()
      .then((profile) => setAvatarUrl(profile.profileImage || null))
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
      right={
        <Pressable
          onPress={() => router.push("/screen/MyProfile")}
          accessibilityRole="button"
          accessibilityLabel="Your profile"
          hitSlop={8}
        >
          <Avatar uri={avatarUrl} size="sm" accessibilityLabel="Your profile" />
        </Pressable>
      }
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
