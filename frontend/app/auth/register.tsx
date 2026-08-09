import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { register } from "../../utils/api";
import Toast from "react-native-toast-message";
import { useTheme } from "@/contexts/ThemeContext";
import { useGoogleAuth } from "@/src/hooks/useGoogleAuth";

const { width, height } = Dimensions.get("window");

export default function RegisterScreen() {
  const { colors } = useTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [referralCode, setReferralCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const router = useRouter();

  const { ready: googleReady, loading: googleLoading, promptAsync: promptGoogle, result: googleResult } =
    useGoogleAuth(acceptedTerms);

  useEffect(() => {
    if (!googleResult) return;
    if (googleResult.data?.token) {
      Toast.show({ type: "success", text1: "Account created with Google" });
      router.push("/screen/DetailFirst");
    } else if (googleResult.error) {
      if (googleResult.error.requiresSignup) {
        Toast.show({
          type: "error",
          text1: "Please accept the Terms of Service first",
          text2: "Check the box below, then try Google again.",
        });
      } else {
        Toast.show({ type: "error", text1: "Google sign-in failed", text2: googleResult.error.message });
      }
    }
  }, [googleResult]);

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

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please fill all fields",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Password do not matched",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Password should be atleast 6 characters",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    if (!acceptedTerms) {
      Toast.show({
        type: "error",
        text1: "Please confirm you're 18+ and accept the Terms of Service",
        position: "top",
        visibilityTime: 3000,
      });
      return;
    }

    try {
      const data = await register(
        username.trim(),
        email.trim(),
        password,
        acceptedTerms,
        referralCode.trim() || undefined
      );
      if (data?.token) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Account created successfully!",
          position: "top",
          visibilityTime: 3000,
        });
        router.push("/screen/DetailFirst");
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to create an account",
          position: "top",
          visibilityTime: 3000,
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Registration Error",
        text2: error.message || "Failed to create an account",
        position: "top",
        visibilityTime: 3000,
      });
    }
  };

  const allFieldsFilled =
    username && email && password && confirmPassword && acceptedTerms;

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
              {/* Logo & Title */}
              <View style={styles.logoSection}>
                <View style={styles.heartContainer}>
                  <Ionicons name="heart" size={60} color="#fff" />
                  <View style={styles.mountainAccent} />
                </View>
              </View>
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
                  <Text style={styles.inputLabel}>Username</Text>
                  <TextInput
                    placeholder="Choose a username"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow },
                    ]}
                  />
                </View>

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
                      placeholder="Create a password"
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

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View
                    style={[
                      styles.passwordWrapper,
                      { backgroundColor: colors.surface, shadowColor: colors.shadow },
                    ]}
                  >
                    <TextInput
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.textTertiary}
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={{
                        flex: 1,
                        fontSize: 16,
                        color: colors.text,
                        paddingVertical: 14, // aligns text perfectly in center
                      }}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={{ paddingHorizontal: 10 }}
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={24}
                        color={colors.textTertiary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Referral Code (optional)</Text>
                  <TextInput
                    placeholder="Have a friend's code?"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="characters"
                    value={referralCode}
                    onChangeText={setReferralCode}
                    style={[
                      styles.textInput,
                      { backgroundColor: colors.surface, color: colors.text, shadowColor: colors.shadow },
                    ]}
                  />
                </View>

                <TouchableOpacity
                  style={styles.termsRow}
                  onPress={() => setAcceptedTerms((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      acceptedTerms && styles.checkboxChecked,
                    ]}
                  >
                    {acceptedTerms && (
                      <Ionicons name="checkmark" size={14} color="#ff6b6b" />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    I confirm I&apos;m 18 or older and agree to the{" "}
                    <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
                    <Text style={styles.termsLink}>Privacy Policy</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.registerBtn,
                    allFieldsFilled && styles.registerBtnActive,
                  ]}
                  onPress={handleRegister}
                  disabled={!allFieldsFilled}
                >
                  <Text style={styles.registerText}>Create Account</Text>
                </TouchableOpacity>

                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[styles.googleBtn, !acceptedTerms && styles.googleBtnDisabled]}
                  onPress={() => promptGoogle()}
                  disabled={!googleReady || !acceptedTerms || googleLoading}
                >
                  <Ionicons name="logo-google" size={20} color="#DB4437" />
                  <Text style={styles.googleBtnText}>
                    {googleLoading ? "Signing in..." : "Continue with Google"}
                  </Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.loginLink}>Login</Text>
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
    marginTop: 10,
    marginBottom: 20,
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
    marginBottom: 20,
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
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 16,
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
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    marginBottom: 6,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  termsText: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    fontWeight: "700",
    textDecorationLine: "underline",
    color: "#fff",
  },
  registerBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },
  registerBtnActive: {
    backgroundColor: "rgba(255,106,136,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  registerText: {
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
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleBtnText: {
    color: "#1a1a1a",
    fontWeight: "700",
    fontSize: 15,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  loginText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  loginLink: {
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
