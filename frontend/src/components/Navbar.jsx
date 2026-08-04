import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import notifications from "@/assets/data/notificationdata";

export default function Navbar() {
  const router = useRouter();
  const notificationCount = notifications.length;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.navbar}>
        {/* Left Side - Logo + App Name + Flag */}
        <View style={styles.left}>
          <Ionicons name="heart" size={26} color="#e63946" />
          <Text style={styles.title}>Soulmate</Text>
          <Text style={styles.flag}>🇳🇵</Text>
        </View>

        {/* Right Side - Notifications */}
        <Pressable
          style={styles.notificationWrapper}
          onPress={() => router.push("/screen/Notification")}
        >
          <Ionicons name="notifications-outline" size={26} color="#444" />
          {notificationCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{notificationCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#fff",
  },
  navbar: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#e63946",
    letterSpacing: 0.5,
  },
  flag: {
    fontSize: 18,
    marginLeft: 4,
  },
  notificationWrapper: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#e63946",
    borderRadius: 12,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
});
