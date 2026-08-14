import { Stack } from "expo-router";
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

function AppShell({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { colors } = useTheme();

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
        {isLoggedIn ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="auth/login" />
        )}

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
    onAuthChange(setIsLoggedIn);
    return () => onAuthChange(null);
  }, []);

  if (isLoggedIn === null) {
    return null; // could replace with a Splash/Loading screen
  }

  return (
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
  );
}
