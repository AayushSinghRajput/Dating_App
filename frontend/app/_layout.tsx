import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initToken, onAuthChange } from "../services/apiClient";
import Toast from "react-native-toast-message";
import { CallProvider } from "../contexts/CallContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ChatNotificationProvider } from "../contexts/ChatNotificationContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import IncomingCallModal from "../src/components/calling/IncomingCallModal";
import InCallScreen from "../src/components/calling/InCallScreen";
import GlobalActionSheet from "../src/components/GlobalActionSheet";
import GlobalMatchCelebration from "../src/components/GlobalMatchCelebration";
import { usePushNotifications, unregisterPushNotificationsAsync } from "../src/hooks/usePushNotifications";
import { initCrashMonitoring } from "../src/utils/crashMonitoring";
import { ErrorBoundary } from "../src/components/ErrorBoundary";
import { connectSocket, disconnectSocket } from "../utils/socket";

initCrashMonitoring();

function AppShell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { colors } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  usePushNotifications();

  useEffect(() => {
    const inAuthGroup = segments[0] === "auth";
    const inOnboarding = segments[0] === "onboarding";

    if (!isLoggedIn) {
      if (inAuthGroup || inOnboarding) {
        return;
      }
      AsyncStorage.getItem("@has_seen_onboarding").then((seen) => {
        if (seen === "true") {
          router.replace("/auth/login");
        } else {
          router.replace("/onboarding");
        }
      });
    } else if (isLoggedIn && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, segments, router]);

  return (
    <>
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.surface}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen
          name="screen/Notification"
          options={{ presentation: "modal" }}
        />
      </Stack>
      <Toast />
      <GlobalActionSheet />
      <GlobalMatchCelebration />
    </>
  );
}

export default function RootLayout() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkLogin = async () => {
      await initToken(); // loads token into memory
      const token = await AsyncStorage.getItem("token");
      setIsLoggedIn(!!token);
    };
    checkLogin();

    // Keep isLoggedIn in sync with every saveToken()/clearToken() call
    // (login, logout, ban-triggered logout, etc.), not just the cold-start
    // check above — otherwise this state can go stale while the app
    // navigates around it.
    onAuthChange((loggedIn) => {
      setIsLoggedIn(loggedIn);
      if (!loggedIn) {
        unregisterPushNotificationsAsync();
        disconnectSocket();
      } else {
        connectSocket(true);
      }
    });
    return () => onAuthChange(null);
  }, []);

  if (isLoggedIn === null) {
    return null; // could replace with a Splash/Loading screen
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <NotificationProvider>
            <ChatNotificationProvider>
              <CallProvider>
                <AppShell isLoggedIn={isLoggedIn} />
                <IncomingCallModal />
                <InCallScreen />
              </CallProvider>
            </ChatNotificationProvider>
          </NotificationProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
