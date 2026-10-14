import React, { useRef } from "react";
import { View, StyleSheet, PanResponder, ViewStyle, StyleProp } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

export interface TabSwipeWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Route to navigate to when user swipes left (finger moves right-to-left) */
  leftTab?: string;
  /** Route to navigate to when user swipes right (finger moves left-to-right) */
  rightTab?: string;
  /** Disable swipe navigation if needed (e.g. while editing or in modal) */
  disabled?: boolean;
}

/**
 * TabSwipeWrapper provides smooth horizontal swipe navigation between bottom tabs
 * while preserving vertical scrolling for lists and scroll views.
 */
export default function TabSwipeWrapper({
  children,
  style,
  leftTab,
  rightTab,
  disabled = false,
}: TabSwipeWrapperProps) {
  const router = useRouter();

  // Keep references to latest tabs so PanResponder always has fresh closures
  const leftTabRef = useRef(leftTab);
  const rightTabRef = useRef(rightTab);
  const disabledRef = useRef(disabled);

  leftTabRef.current = leftTab;
  rightTabRef.current = rightTab;
  disabledRef.current = disabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,

      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        if (disabledRef.current) return false;
        const { dx, dy } = gestureState;
        const isHorizontal = Math.abs(dx) > Math.abs(dy) * 1.5;
        const hasMovedEnough = Math.abs(dx) > 20;
        const hasTarget =
          (dx < 0 && Boolean(leftTabRef.current)) ||
          (dx > 0 && Boolean(rightTabRef.current));
        return isHorizontal && hasMovedEnough && hasTarget;
      },

      onMoveShouldSetPanResponderCapture: (_evt, gestureState) => {
        if (disabledRef.current) return false;
        const { dx, dy } = gestureState;
        // Strictly capture horizontal swipes to prevent vertical scroll jitter
        const isClearlyHorizontal = Math.abs(dx) > Math.abs(dy) * 2;
        const hasMovedEnough = Math.abs(dx) > 24;
        const hasTarget =
          (dx < 0 && Boolean(leftTabRef.current)) ||
          (dx > 0 && Boolean(rightTabRef.current));
        return isClearlyHorizontal && hasMovedEnough && hasTarget;
      },

      onPanResponderTerminationRequest: () => true,

      onPanResponderRelease: (_evt, gestureState) => {
        if (disabledRef.current) return;
        const { dx, vx } = gestureState;
        const SWIPE_DISTANCE_THRESHOLD = 45;
        const SWIPE_VELOCITY_THRESHOLD = 0.3;

        // Swiped Left (finger moved right to left) -> Go to leftTab
        if (
          leftTabRef.current &&
          (dx < -SWIPE_DISTANCE_THRESHOLD || (dx < -20 && vx < -SWIPE_VELOCITY_THRESHOLD))
        ) {
          Haptics.selectionAsync().catch(() => {});
          router.navigate(leftTabRef.current as any);
        }
        // Swiped Right (finger moved left to right) -> Go to rightTab
        else if (
          rightTabRef.current &&
          (dx > SWIPE_DISTANCE_THRESHOLD || (dx > 20 && vx > SWIPE_VELOCITY_THRESHOLD))
        ) {
          Haptics.selectionAsync().catch(() => {});
          router.navigate(rightTabRef.current as any);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]} {...panResponder.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
