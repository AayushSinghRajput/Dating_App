import React, { useState, useEffect, useRef } from "react";
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
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, MaterialIcons, Ionicons } from "@expo/vector-icons";

// Firebase auth
import { auth, GoogleAuthProvider, app } from "../../config/firebaseConfig";
import {
  signInWithCredential,
  signInWithPhoneNumber,
  onAuthStateChanged,
} from "firebase/auth";

// Expo Google Auth
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

// Expo Firebase reCAPTCHA
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";

WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

export default function AuthScreen() {
  const [step, setStep] = useState<"main" | "phone" | "otp">("main");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const router = useRouter();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);

  // ---------------- ANIMATION ----------------
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  // ---------------- PHONE AUTH ----------------
  const handlePhoneLogin = async () => {
    if (phone.trim().length !== 10) {
      Alert.alert("Error", "Enter a valid 10-digit phone number");
      return;
    }
    try {
      if (!recaptchaVerifier.current) return;
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        "+977" + phone,
        recaptchaVerifier.current
      );
      setConfirmation(confirmationResult);
      setStep("otp");
      Alert.alert("OTP Sent", `Verification code sent to +977${phone}`);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    }
  };

  const handleOtpVerify = async () => {
    if (!confirmation) {
      Alert.alert("Error", "No OTP confirmation found.");
      return;
    }
    try {
      await confirmation.confirm(otp);
      Alert.alert("Success", "Phone verified!");
      router.push("/screen/DetailFirst");
    } catch (error: any) {
      Alert.alert("Error", "Invalid OTP");
    }
  };

  // ---------------- GOOGLE SIGN-IN ----------------
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: "788278716084-7etdavmq6anftucenfesmprpb30sskgf.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      if (!id_token) {
        Alert.alert("Google Sign-In Error", "No ID Token received");
        return;
      }
      const googleCredential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, googleCredential)
        .then(() => {
          Alert.alert("Success", "Google Sign-In Successful!");
          router.push("/screen/DetailFirst");
        })
        .catch((err) =>
          Alert.alert("Google Sign-In Error", err.message || "Failed")
        );
    }
  }, [response]);

  const handleGoogleLogin = async () => await promptAsync();

  // ---------------- AUTH STATE CHANGE ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) console.log("User logged in:", user.email || user.phoneNumber);
      else console.log("User logged out");
    });
    return unsubscribe;
  }, []);

  // ---------------- RENDER ----------------
  const renderContent = () => {
    switch (step) {
      case "main":
        return (
          <Animated.View
            style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.logoContainer}>
              <View style={styles.heartContainer}>
                <Ionicons name="heart" size={60} color="#fff" />
                <View style={styles.mountainAccent} />
              </View>
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Soulmate</Text>
              <View style={styles.titleUnderline} />
              <Text style={styles.subtitle}>
                Discover love in the heart of Nepal 🏔️
              </Text>
              <Text style={styles.tagline}>&quot;जहाँ मन मिल्छ, त्यहीँ घर हुन्छ&quot;</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.phoneBtn]}
                onPress={() => setStep("phone")}
                activeOpacity={0.8}
              >
                <View style={styles.btnIconContainer}>
                  <MaterialIcons name="phone-android" size={24} color="#fff" />
                </View>
                <Text style={styles.btnText}>Continue with Phone</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, styles.googleBtn]}
                onPress={handleGoogleLogin}
                activeOpacity={0.8}
              >
                <View style={styles.btnIconContainer}>
                  <AntDesign name="google" size={24} color="#fff" />
                </View>
                <Text style={styles.btnText}>Continue with Google</Text>
                <Ionicons name="chevron-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </Animated.View>
        );

      case "phone":
        return (
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            {/* ✅ Pass app.options, NOT auth */}
            <FirebaseRecaptchaVerifierModal
              ref={recaptchaVerifier}
              firebaseConfig={app.options}
              attemptInvisibleVerification={false} 
            />

            <View style={styles.formHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setStep("main")}
              >
                <Ionicons name="chevron-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.formTitle}>Phone Verification</Text>
            </View>

            <View style={styles.phoneInputContainer}>
              <Text style={styles.inputLabel}>Enter your mobile number</Text>
              <Text style={styles.inputSubLabel}>
                We&apos;ll send you a verification code
              </Text>

              <View style={styles.phoneInputWrapper}>
                <View style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>🇳🇵 +977</Text>
                </View>
                <TextInput
                  placeholder="98XXXXXXXX"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  maxLength={10}
                  style={styles.phoneInput}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, phone.length === 10 && styles.continueBtnActive]}
              onPress={handlePhoneLogin}
            >
              <Text style={styles.continueText}>Send Verification Code</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case "otp":
        return (
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Verify Code</Text>
            </View>

            <View style={styles.otpContainer}>
              <Text style={styles.inputLabel}>Enter verification code</Text>
              <Text style={styles.inputSubLabel}>Sent to +977 {phone}</Text>

              <TextInput
                placeholder="• • • • • •"
                placeholderTextColor="#ccc"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                style={styles.otpInput}
                textAlign="center"
              />

              <TouchableOpacity
                style={styles.resendButton}
                onPress={handlePhoneLogin}
              >
                <Text style={styles.resendText}>Didn&apos;`t receive code? Resend</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.continueBtn, otp.length === 6 && styles.continueBtnActive]}
              onPress={handleOtpVerify}
            >
              <Text style={styles.continueText}>Verify & Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
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
          {renderContent()}
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1, padding: 24, paddingTop: 60 },
  contentContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  logoContainer: { marginBottom: 40 },
  heartContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 120,
    height: 120,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  mountainAccent: {
    position: "absolute",
    bottom: 15,
    width: 30,
    height: 15,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderRadius: 15,
  },
  titleContainer: { alignItems: "center", marginBottom: 60 },
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
  buttonContainer: { width: "100%", maxWidth: 320 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  phoneBtn: {
    backgroundColor: "rgba(52,168,83,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  googleBtn: {
    backgroundColor: "rgba(219,68,55,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  btnIconContainer: { width: 40, alignItems: "center" },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  dividerText: {
    color: "#fff",
    marginHorizontal: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  footer: { marginTop: 40, paddingHorizontal: 20 },
  footerText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  formContainer: {
    flex: 1,
    width: "100%",
    maxWidth: 320,
    alignSelf: "center",
    paddingTop: 40,
  },
  formHeader: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  formTitle: { fontSize: 24, fontWeight: "bold", color: "#fff", flex: 1 },
  phoneInputContainer: { marginBottom: 40 },
  inputLabel: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  inputSubLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 24,
  },
  phoneInputWrapper: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  countryCode: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 16,
    paddingVertical: 18,
    borderRightWidth: 1,
    borderRightColor: "#e9ecef",
    justifyContent: "center",
  },
  countryCodeText: { fontSize: 16, fontWeight: "600", color: "#495057" },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 16,
    color: "#333",
  },
  otpContainer: { alignItems: "center", marginBottom: 40 },
  otpInput: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  resendButton: { padding: 8 },
  resendText: { color: "#fff", fontSize: 14, textDecorationLine: "underline" },
  continueBtn: {
    backgroundColor: "rgba(255,255,255,0.3)",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: "auto",
    marginBottom: 40,
  },
  continueBtnActive: {
    backgroundColor: "rgba(255,106,136,0.9)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  continueText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
