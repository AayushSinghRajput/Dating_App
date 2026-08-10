import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { login } from "../../services/authService";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { useGoogleAuth } from "@/src/hooks/useGoogleAuth";

const { width, height } = Dimensions.get("window");

export default function AuthScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const router = useRouter();

  const { ready: googleReady, loading: googleLoading, promptAsync: promptGoogle, result: googleResult } =
    useGoogleAuth(false);

  useEffect(() => {
    if (!googleResult) return;
    if (googleResult.data?.token) {
      Toast.show({ type: "success", text1: "Login successful!" });
      router.push("/(tabs)");
    } else if (googleResult.error) {
      if (googleResult.error.requiresSignup) {
        Toast.show({
          type: "info",
          text1: "No account found",
          text2: "Please create an account first.",
        });
        router.push("/auth/register");
      } else {
        Toast.show({ type: "error", text1: "Google sign-in failed", text2: googleResult.error.message });
      }
    }
  }, [googleResult]);

  // ---------------- ANIMATION ----------------
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ---------------- BACKEND LOGIN ----------------
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Please enter both email and password",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const data = await login(email.trim(), password);
      if (data?.token) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Login successful !",
          position: "top",
          visibilityTime: 3000,
        });
        router.push("/(tabs)");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Invalid credentials",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Login Error",
        text2: error.message || "Failed to login",
        position: "top",
        visibilityTime: 3000,
      });
      router.push('/auth/register');
    }
  };

  return (
    <>
      <StatusBar
        barStyle={colors.statusBarStyle}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#ff6b6b", "#ff8e8e", "#ffa8a8", "#ffb3ba"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.contentContainer,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <View style={styles.heartContainer}>
                  <Ionicons name="heart" size={60} color="#fff" />
                  <View style={styles.mountainAccent} />
                </View>
              </View>

              {/* Title Section */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>Soulmate</Text>
                <View style={styles.titleUnderline} />
                <Text style={styles.subtitle}>
                  Discover love in the heart of Nepal 🏔️
                </Text>
                <Text style={styles.tagline}>
                  &quot;जहाँ मन मिल्छ, त्यहीँ घर हुन्छ&quot;
                </Text>
              </View>

              {/* Form Section */}
              <View style={styles.formSection}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Email</Text>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow },
                    ]}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View
                    style={[
                      styles.passwordWrapper,
                      { backgroundColor: colors.surface, shadowColor: colors.shadow },
                    ]}
                  >
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.text,
                        paddingVertical: 14, // aligns text perfectly in center
                      }}
                    />

                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ paddingHorizontal: 10 }}
                    >
                      <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={24}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.forgotPasswordRow}
                  onPress={() => router.push("/auth/forgot-password")}
                >
                  <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.loginBtn,
                    email && password && styles.loginBtnActive,
                  ]}
                  onPress={handleLogin}
                  disabled={!email || !password}
                >
                  <Text style={styles.loginText}>Continue</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={styles.googleBtn}
                  onPress={() => promptGoogle()}
                  disabled={!googleReady || googleLoading}
                >
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.googleBtnText}>
                    {googleLoading ? "Signing in..." : "Continue with Google"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.registerContainer}>
                  <Text style={styles.registerText}>
                    Don&apos;t have an account?{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/auth/register")}
                  >
                    <Text style={styles.registerLink}>Create an account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  contentContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: height - 120,
  },
  logoSection: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  heartContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 140,
    height: 140,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    paddingTop: 10,
  },
  mountainAccent: {
    position: "absolute",
    bottom: 20,
    width: 35,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 18,
  },
  titleSection: {
    alignItems: "center",
    marginBottom: 30,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  titleUnderline: {
    width: 60,
    height: 3,
    backgroundColor: "#fff",
    borderRadius: 2,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    fontStyle: "italic",
  },
  formSection: {
    width: "100%",
    maxWidth: 320,
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 8,
  },
  textInput: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16, // reduced a bit for consistent alignment
    fontSize: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  forgotPasswordRow: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotPasswordText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  loginBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },
  loginBtnActive: {
    backgroundColor: "rgba(255,106,136,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 25,
  },
  googleBtnText: {
    color: "#1a1a1a",
    fontWeight: "700",
    fontSize: 15,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  registerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  registerLink: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 12, // slightly less so inner input aligns nicely
    height: 56, // same visual height as normal input
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
