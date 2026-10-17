import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useCall } from "@/contexts/CallContext";

export default function IncomingCallModal() {
  const { callStatus, callType, remoteUser, acceptCall, rejectCall } = useCall();

  const visible = callStatus === "incoming-ringing" && !!remoteUser;

  // Pulse animation for avatar ripple rings (WhatsApp-like ringing waves)
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring1Opacity = useRef(new Animated.Value(0.6)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.4)).current;

  // Subtle bounce pulse for the accept button
  const acceptButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Loop ringing waves
    const ringAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(ring1Scale, {
            toValue: 1.55,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(ring1Opacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring1Opacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(ring2Scale, {
            toValue: 1.85,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(ring2Opacity, {
            toValue: 0,
            duration: 1800,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Opacity, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    // Subtle breathing pulse on Accept button
    const acceptPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(acceptButtonScale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(acceptButtonScale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    ringAnimation.start();
    acceptPulse.start();

    return () => {
      ringAnimation.stop();
      acceptPulse.stop();
      ring1Scale.setValue(1);
      ring1Opacity.setValue(0.6);
      ring2Scale.setValue(1);
      ring2Opacity.setValue(0.4);
      acceptButtonScale.setValue(1);
    };
  }, [visible, ring1Scale, ring1Opacity, ring2Scale, ring2Opacity, acceptButtonScale]);

  if (!visible) return null;

  const isVideo = callType === "video";
  const avatarUri = remoteUser?.avatar?.trim();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      hardwareAccelerated
      onRequestClose={rejectCall}
    >
      <View style={styles.overlay}>
        {/* Top Header: Security badge & Call Type (WhatsApp style) */}
        <View style={styles.topHeader}>
          <View style={styles.encryptionBadge}>
            <Ionicons name="lock-closed" size={13} color="rgba(255, 255, 255, 0.7)" />
            <Text style={styles.encryptionText}>End-to-end encrypted</Text>
          </View>
          <View style={styles.callTypeBadge}>
            <Ionicons
              name={isVideo ? "videocam" : "call"}
              size={16}
              color="#25D366"
            />
            <Text style={styles.callTypeLabel}>
              {isVideo ? "Soulmate Video Call" : "Soulmate Audio Call"}
            </Text>
          </View>
        </View>

        {/* Center: Ringing Waves + Caller Avatar + Details */}
        <View style={styles.centerContainer}>
          <View style={styles.avatarWrapper}>
            {/* Outer wave ring 2 */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: ring2Scale }],
                  opacity: ring2Opacity,
                },
              ]}
            />
            {/* Outer wave ring 1 */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: ring1Scale }],
                  opacity: ring1Opacity,
                },
              ]}
            />

            {/* Caller Avatar */}
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.fallbackAvatar]}>
                <Text style={styles.fallbackInitial}>
                  {(remoteUser?.name || "S").charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.callerName} numberOfLines={1}>
            {remoteUser?.name || "Caller"}
          </Text>
          <Text style={styles.ringingStatus}>Ringing…</Text>
        </View>

        {/* Bottom Actions: WhatsApp Decline / Accept Buttons */}
        <View style={styles.bottomActions}>
          {/* Decline Button */}
          <View style={styles.actionColumn}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                styles.declineButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={rejectCall}
              accessibilityLabel="Decline Call"
            >
              <Ionicons
                name="call"
                size={32}
                color="#FFFFFF"
                style={styles.declineIcon}
              />
            </Pressable>
            <Text style={styles.actionLabel}>Decline</Text>
          </View>

          {/* Accept Button */}
          <View style={styles.actionColumn}>
            <Animated.View style={{ transform: [{ scale: acceptButtonScale }] }}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  styles.acceptButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={acceptCall}
                accessibilityLabel="Accept Call"
              >
                <Ionicons
                  name={isVideo ? "videocam" : "call"}
                  size={32}
                  color="#FFFFFF"
                />
              </Pressable>
            </Animated.View>
            <Text style={styles.actionLabel}>Accept</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#0B141B", // WhatsApp Dark call background
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 68,
    paddingBottom: 72,
    paddingHorizontal: 28,
  },
  topHeader: {
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  encryptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  encryptionText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  callTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },
  callTypeLabel: {
    color: "#E9EDEF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  centerContainer: {
    alignItems: "center",
    width: "100%",
  },
  avatarWrapper: {
    width: 156,
    height: 156,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  rippleRing: {
    position: "absolute",
    width: 156,
    height: 156,
    borderRadius: 78,
    borderWidth: 2,
    borderColor: "#25D366",
    backgroundColor: "rgba(37, 211, 102, 0.12)",
  },
  avatar: {
    width: 144,
    height: 144,
    borderRadius: 72,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.2)",
    backgroundColor: "#1F2C34",
  },
  fallbackAvatar: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2A3942",
  },
  fallbackInitial: {
    fontSize: 54,
    fontWeight: "700",
    color: "#E9EDEF",
  },
  callerName: {
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.3,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  ringingStatus: {
    fontSize: 16,
    fontWeight: "500",
    color: "#8696A0",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  bottomActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 36,
  },
  actionColumn: {
    alignItems: "center",
    gap: 14,
  },
  actionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  declineButton: {
    backgroundColor: "#EA4335", // Vibrant Hangup Crimson
  },
  acceptButton: {
    backgroundColor: "#25D366", // WhatsApp Vibrant Call Green
  },
  declineIcon: {
    transform: [{ rotate: "135deg" }],
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.94 }],
  },
  actionLabel: {
    color: "#E9EDEF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
});
