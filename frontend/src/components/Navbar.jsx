import { View, Text, Image, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import notifications from "@/assets/data/notificationdata";
import { useTheme } from "@/contexts/ThemeContext";

const logo = require("../../assets/images/logo.png");

export default function Navbar() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const notificationCount = notifications.length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.surface }]} edges={["top"]}>
      <LinearGradient
        colors={isDark ? [colors.surface, colors.surface] : ["#ffffff", "#fff5f6"]}
        style={[styles.navbar, { borderBottomColor: colors.border }]}
      >
        {/* Left Side - Logo + Catchline */}
        <View style={styles.left}>
          <Image source={logo} style={styles.logoImage} resizeMode="cover" />
        </View>

        {/* Right Side - Notifications */}
        <Pressable
          style={({ pressed }) => [
            styles.notificationWrapper,
            { backgroundColor: colors.accentSoft },
            pressed && { backgroundColor: colors.accentSoftPressed, transform: [{ scale: 0.96 }] },
          ]}
          onPress={() => router.push("/screen/Notification")}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.accent} />
          {notificationCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
              <Text style={styles.badgeText}>
                {notificationCount > 9 ? "9+" : notificationCount}
              </Text>
            </View>
          )}
        </Pressable>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {},
  navbar: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  notificationWrapper: {
    position: "relative",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -4,
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
});
