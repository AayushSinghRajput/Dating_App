import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initToken } from "../utils/api";
import Toast from "react-native-toast-message";
import { CallProvider } from "../contexts/CallContext";
import IncomingCallModal from "../src/components/calling/IncomingCallModal";
import InCallScreen from "../src/components/calling/InCallScreen";

function AppShell({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
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
      {isLoggedIn ? (
        <CallProvider>
          <AppShell isLoggedIn={isLoggedIn} />
          <IncomingCallModal />
          <InCallScreen />
        </CallProvider>
      ) : (
        <AppShell isLoggedIn={isLoggedIn} />
      )}
    </SafeAreaProvider>
  );
}
