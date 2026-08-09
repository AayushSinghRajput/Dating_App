import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initToken } from "../utils/api";
import Toast from "react-native-toast-message";
import { CallProvider } from "../contexts/CallContext";
import { NotificationProvider } from "../contexts/NotificationContext";
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
  }, []);

  if (isLoggedIn === null) {
    return null; // could replace with a Splash/Loading screen
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        {isLoggedIn ? (
          <NotificationProvider>
            <CallProvider>
              <AppShell isLoggedIn={isLoggedIn} />
              <IncomingCallModal />
              <InCallScreen />
            </CallProvider>
          </NotificationProvider>
        ) : (
          <AppShell isLoggedIn={isLoggedIn} />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
