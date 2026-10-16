import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "../contexts/ThemeContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface OnboardingSlide {
  id: string;
  badge: string;
  title: string;
  highlightText: string;
  titleEnd: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconSecondary: keyof typeof Ionicons.glyphMap;
  tags: string[];
  gradientColors: [string, string];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: "1",
    badge: "DISCOVER",
    title: "Find Real & ",
    highlightText: "Meaningful",
    titleEnd: " Connections",
    description:
      "Meet genuine singles nearby who match your vibe, passions, and life goals. No endless superficial scrolling—just authentic dating.",
    iconName: "heart-circle",
    iconSecondary: "flame",
    tags: ["Smart Match", "Near You", "Real Intentions"],
    gradientColors: ["#ff4b6e", "#e63946"],
  },
  {
    id: "2",
    badge: "SAFETY & TRUST",
    title: "A Safe Community ",
    highlightText: "Built on Trust",
    titleEnd: "",
    description:
      "Every profile is selfie-verified with strict anti-harassment safeguards. Your location and private data remain strictly under your control.",
    iconName: "shield-checkmark",
    iconSecondary: "lock-closed",
    tags: ["Selfie Verified", "Zero Catfish", "Privacy Control"],
    gradientColors: ["#e63946", "#b5179e"],
  },
  {
    id: "3",
    badge: "INTERACTION",
    title: "Spark Chemistry with ",
    highlightText: "Chat & Calls",
    titleEnd: "",
    description:
      "Go beyond text messages with crystal-clear voice notes and secure HD video calling. Connect face-to-face before your first coffee date.",
    iconName: "chatbubbles",
    iconSecondary: "videocam",
    tags: ["Real-time Chat", "Voice Notes", "HD Video Calls"],
    gradientColors: ["#b5179e", "#7209b7"],
  },
];

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await AsyncStorage.setItem("@has_seen_onboarding", "true");
      router.replace("/auth/login");
    } catch {
      router.replace("/auth/login");
    }
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    if (index >= 0 && index < SLIDES.length && index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  const renderSlide = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={[styles.slideContainer, { width: SCREEN_WIDTH }]}>
        {/* Visual Graphic Hero */}
        <View style={styles.heroWrapper}>
          <View
            style={[
              styles.heroBackdropCircle,
              {
                backgroundColor: isDark
                  ? "rgba(230, 57, 70, 0.08)"
                  : "rgba(230, 57, 70, 0.06)",
              },
            ]}
          >
            <View
              style={[
                styles.heroMiddleCircle,
                {
                  backgroundColor: isDark
                    ? "rgba(230, 57, 70, 0.14)"
                    : "rgba(230, 57, 70, 0.12)",
                },
              ]}
            >
              <LinearGradient
                colors={item.gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Ionicons name={item.iconName} size={74} color="#ffffff" />
              </LinearGradient>
            </View>
          </View>

          {/* Floating Accent Badge */}
          <View
            style={[
              styles.floatingBadge,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                shadowColor: colors.shadow,
              },
            ]}
          >
            <Ionicons name={item.iconSecondary} size={18} color={colors.accent} />
            <Text style={[styles.floatingBadgeText, { color: colors.text }]}>
              {item.badge}
            </Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            {item.title}
            <Text style={{ color: colors.accent }}>{item.highlightText}</Text>
            {item.titleEnd}
          </Text>

          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {item.description}
          </Text>

          {/* Pill tags */}
          <View style={styles.tagContainer}>
            {item.tags.map((tag, idx) => (
              <View
                key={idx}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: isDark ? colors.surfaceAlt : colors.accentSoft,
                    borderColor: isDark ? colors.border : "transparent",
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={14}
                  color={colors.accent}
                  style={styles.tagIcon}
                />
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: isDark ? colors.text : colors.accent,
                    },
                  ]}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle={colors.statusBarStyle}
        backgroundColor={colors.background}
      />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.brandLogo}
            resizeMode="cover"
          />
          <Text style={[styles.brandName, { color: colors.text }]}>
            Soul<Text style={{ color: colors.accent }}>mate</Text>
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleFinish}
          activeOpacity={0.7}
          style={[styles.skipButton, { backgroundColor: colors.surfaceAlt }]}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slides Carousels */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onMomentumScrollEnd={onScroll}
        style={styles.flatList}
      />

      {/* Bottom Footer Section */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.paginationRow}>
          {SLIDES.map((_, index) => {
            const isActive = index === currentIndex;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: isActive
                      ? colors.accent
                      : isDark
                      ? "#333336"
                      : "#e2e2e6",
                    width: isActive ? 24 : 8,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.85}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={
              isLastSlide
                ? ["#ff4b6e", "#e63946"]
                : [colors.accent, colors.accent]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButton}
          >
            <Text style={styles.buttonText}>
              {isLastSlide ? "Get Started" : "Next"}
            </Text>
            <Ionicons
              name={isLastSlide ? "sparkles" : "arrow-forward"}
              size={18}
              color="#ffffff"
              style={styles.buttonIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandLogo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    overflow: "hidden",
  },
  brandName: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  skipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  flatList: {
    flex: 1,
  },
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  heroWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SCREEN_HEIGHT * 0.03,
    position: "relative",
  },
  heroBackdropCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    alignItems: "center",
    justifyContent: "center",
  },
  heroMiddleCircle: {
    width: 196,
    height: 196,
    borderRadius: 98,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e63946",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  floatingBadge: {
    position: "absolute",
    bottom: -6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  floatingBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 33,
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 0.5,
  },
  tagIcon: {
    marginRight: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 12,
    gap: 20,
  },
  paginationRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: 28,
    overflow: "hidden",
    shadowColor: "#e63946",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonIcon: {
    marginLeft: 2,
  },
});
